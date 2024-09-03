<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { onBeforeUnmount, computed, ref, watch, nextTick } from 'vue';

import { createDownload } from '~/composables/printOptions';
import { formService, utilsService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';
import {
  fileToBase64,
  getDisposition,
  splitFileName,
} from '~/utils/transformUtils';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    type: String,
    default: '',
  },
  submission: {
    type: Object,
    default: undefined,
  },
  f: {
    type: String,
    default: '',
  },
});

const dialog = ref(false);
const loading = ref(false);
const templateForm = ref({
  files: [],
  contentFileType: null,
  outputFileName: '',
  outputFileType: null,
});
const expandedText = ref(false);
const timeout = ref(undefined);
const tab = ref('tab-1');
const selectedOption = ref('upload');
const defaultReportname = ref('');
const defaultTemplate = ref(false);
const defaultTemplateContent = ref(null);
const defaultTemplateDate = ref('');
const defaultTemplateFilename = ref('');
const defaultTemplateExtension = ref('');
const displayTemplatePrintButton = ref(false);
const isValidFile = ref(true);
const isValidSize = ref(true);
const fileInput = ref(null);
const fileInputKey = ref(0);
const validFileExtensions = ref(['txt', 'docx', 'html', 'odt', 'pptx', 'xlsx']);
const defaultExportFileTypes = ref(['pdf']);
const uploadExportFileTypes = ref(['pdf']);

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { isRTL, form } = storeToRefs(formStore);

const files = computed(() => templateForm.value.files);
const formId = computed(() => (properties.f ? properties.f : form.value.id));
const validationRules = computed(() => [
  isValidSize.value || t('trans.documentTemplate.fileSizeError'),
  isValidFile.value || t('trans.documentTemplate.invalidFileMessage'),
]);

watch(files, () => {
  if (
    templateForm.value.files.length === null ||
    templateForm.value.files.length === 0
  ) {
    displayTemplatePrintButton.value = false;
  }
  if (
    templateForm.value?.files &&
    templateForm.value.files[0] instanceof File
  ) {
    displayTemplatePrintButton.value = true;
    const { name, extension } = splitFileName(templateForm.value.files[0].name);
    if (!templateForm.value.outputFileName) {
      templateForm.value.outputFileName = name;
    }
    templateForm.value.contentFileType = extension;
    if (!uploadExportFileTypes.value.includes(extension)) {
      uploadExportFileTypes.value.push(extension);
    }
  }
});

watch(selectedOption, () => {
  if (selectedOption.value === 'default') {
    displayTemplatePrintButton.value = true;
  } else if (selectedOption.value === 'upload') {
    displayTemplatePrintButton.value = templateForm.value.files.length > 0;
  } else {
    displayTemplatePrintButton.value = false;
  }
});

onBeforeUnmount(() => {
  if (timeout.value) clearTimeout(timeout.value);
});

async function printBrowser() {
  //handle the 'Download Options' popup (v-dialog)
  dialog.value = false;

  if (expandedText.value) {
    // Get all text input elements
    let inputs = document.querySelectorAll('input[type="text"]');

    // Create arrays to store original input fields and new divs
    let originalInputs = [];
    let divs = [];

    inputs.forEach((input) => {
      let div = document.createElement('div');
      div.textContent = input.value;
      // apply styling
      div.style.width = '100%';
      div.style.height = 'auto';
      div.style.padding = '6px 12px';
      div.style.lineHeight = '1.5';
      div.style.color = '#495057';
      div.style.border = '1px solid #606060';
      div.style.borderRadius = '4px';
      div.style.boxSizing = 'border-box';

      // Store the original input and new div
      originalInputs.push(input);
      divs.push(div);

      // Replace the input with the div
      input.parentNode.replaceChild(div, input);
    });

    window.onafterprint = () => {
      // Restore the original input fields after printing
      originalInputs.forEach((input, index) => {
        divs[index].parentNode.replaceChild(input, divs[index]);
      });
      //show the dialog again
      dialog.value = true;
    };
  }

  //delaying window.print() so that the 'Download Options' popup isn't rendered
  timeout.value = setTimeout(() => window.print(), 500);
}

async function generate() {
  try {
    loading.value = true;
    let outputFileType = templateForm.value.outputFileType || 'pdf';
    let content = '';
    let contentFileType = '';
    let outputFileName = '';

    if (selectedOption.value === 'default') {
      content = defaultTemplateContent.value;
      contentFileType = defaultTemplateExtension.value;
      outputFileName = defaultReportname.value;
    } else if (selectedOption.value === 'upload') {
      content = await fileToBase64(templateForm.value.files[0]);
      contentFileType = templateForm.value.contentFileType;
      outputFileName = templateForm.value.outputFileName;
    }

    const body = createBody(
      content,
      contentFileType,
      outputFileName,
      outputFileType
    );
    let response = null;
    // Submit Template to CDOGS API
    if (properties.submissionId?.length > 0) {
      response = await formService.docGen(properties.submissionId, body);
    } else {
      const draftData = {
        template: body,
        submission: properties.submission,
      };
      response = await utilsService.draftDocGen(draftData);
    }
    // create file to download
    const filename = getDisposition(response.headers['content-disposition']);

    const blob = new Blob([response.data], {
      type: 'attachment',
    });

    // Generate Temporary Download Link
    createDownload(blob, filename);
    notificationStore.addNotification({
      text: t('trans.printOptions.docGrnSucess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.printOptions.failedDocGenErrMsg'),
      consoleError: t('trans.printOptions.failedDocGenErrMsg', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

function createBody(content, contentFileType, outputFileName, outputFileType) {
  return {
    options: {
      reportName: outputFileName,
      convertTo: outputFileType,
      overwrite: true,
    },
    template: {
      content: content,
      encodingType: 'base64',
      fileType: contentFileType,
    },
  };
}

async function fetchDefaultTemplate() {
  // Calling the API to check whether the form has any uploaded document templates
  loading.value = true;
  try {
    const response1 = await formService.documentTemplateList(formId.value);
    if (response1 && response1.data.length > 0) {
      defaultTemplate.value = true;
      selectedOption.value = 'default';
    }
    if (defaultTemplate.value) {
      const docId = response1.data[0].id;
      const response2 = await formService.documentTemplateRead(
        formId.value,
        docId
      );
      const temp = response2.data.template.data;
      const base64String = temp
        .map((code) => String.fromCharCode(code))
        .join('');
      defaultTemplateContent.value = base64String;
      defaultTemplateFilename.value = response1.data[0].filename;
      const { name, extension } = splitFileName(response2.data.filename);
      defaultTemplateExtension.value = extension;
      defaultReportname.value = name;
      defaultTemplateDate.value = response2.data.createdAt.split('T')[0];

      if (!defaultExportFileTypes.value.includes(extension)) {
        defaultExportFileTypes.value.push(extension);
      }
    }
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.documentTemplate.fetchError'),
      consoleError: t('trans.documentTemplate.fetchError', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

function validateFile(event) {
  if (event.length > 0) {
    // validate file size
    if (event[0].size > 25000000) {
      isValidSize.value = false;
    } else {
      isValidSize.value = true;
    }

    // validate file extension
    const fileExtension = event[0].name.split('.').pop();
    // reset the outputFileName when a new file is uploaded
    templateForm.value.outputFileName = event[0].name
      .split('.')
      .slice(0, -1)
      .join('.');
    // reset uploadExportFileTypes when a new file is uploaded
    uploadExportFileTypes.value = ['pdf'];
    // reset the v-select value
    templateForm.value.outputFileType = null;
    if (validFileExtensions.value.includes(fileExtension)) {
      isValidFile.value = true;
    } else {
      isValidFile.value = false;
    }
  } else {
    // Remove the file extension from uploadExportFileTypes when the file input is cleared
    const fileExtension = templateForm.value.contentFileType;
    if (fileExtension && fileExtension !== 'pdf') {
      uploadExportFileTypes.value = uploadExportFileTypes.value.filter(
        (type) => type !== fileExtension
      );
    }
    isValidFile.value = true;
    isValidSize.value = true;
  }
}

function handleFileUpload(event) {
  fileInputKey.value += 1;
  templateForm.value.files = event;
  validateFile(event);

  //force immediate validation as the v-file-input is bound to the :key
  nextTick(() => {
    if (fileInput.value) {
      fileInput.value.validate();
    }
  });
}

defineExpose({
  createBody,
  createDownload,
  fetchDefaultTemplate,
  isValidFile,
  isValidSize,
  selectedOption,
  templateForm,
  timeout,
  uploadExportFileTypes,
  validateFile,
});
</script>

<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-printer"
          :title="$t('trans.printOptions.print')"
          @click="dialog = true"
        />
      </template>
      <span :lang="locale">{{ $t('trans.printOptions.print') }}</span>
    </v-tooltip>

    <v-dialog
      v-model="dialog"
      width="900"
      content-class="export-submissions-dlg"
    >
      <v-card :class="{ 'dir-rtl': isRTL }">
        <v-card-title class="text-h5 pb-0 mt-2" :lang="locale">{{
          $t('trans.printOptions.printOptions')
        }}</v-card-title>
        <v-card-text>
          <v-tabs v-model="tab" class="mb-5">
            <v-tab value="tab-1">{{
              $t('trans.printOptions.browserPrint')
            }}</v-tab>
            <v-tab value="tab-2" @click="fetchDefaultTemplate">{{
              $t('trans.printOptions.templatePrint')
            }}</v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item value="tab-1">
              <v-checkbox v-model="expandedText" color="primary">
                <template #label>
                  <span>{{ $t('trans.printOptions.expandtextFields') }}</span>
                </template>
              </v-checkbox>
              <div class="flex-container mb-2">
                <v-btn
                  :class="isRTL ? 'ml-2' : 'mr-2'"
                  color="primary"
                  :title="$t('trans.printOptions.browserPrint')"
                  @click="printBrowser"
                >
                  <span :lang="locale">{{
                    $t('trans.printOptions.browserPrint')
                  }}</span>
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="textLink"
                  :class="isRTL ? 'ml-5' : 'mr-5'"
                  :title="$t('trans.formSubmission.cancel')"
                  @click="dialog = false"
                >
                  <span :lang="locale">{{
                    $t('trans.formSubmission.cancel')
                  }}</span>
                </v-btn>
                <!-- More Info Link -->
                <a
                  href="https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Printing-from-a-browser/"
                  target="_blank"
                  class="more-info-link"
                  :lang="locale"
                >
                  <v-icon size="small" class="mx-1">mdi-help-circle</v-icon>
                  {{ $t('trans.printOptions.moreInfo') }}
                </a>
              </div>
            </v-window-item>
            <v-window-item value="tab-2">
              <v-radio-group v-model="selectedOption">
                <v-skeleton-loader type="list-item" :loading="loading">
                  <!-- Radio 1 -->
                  <v-radio
                    v-if="defaultTemplate"
                    :label="$t('trans.printOptions.defaultCdogsTemplate')"
                    value="default"
                  ></v-radio>
                  <v-table
                    v-if="selectedOption === 'default'"
                    style="
                      color: gray;
                      border: 1px solid lightgray;
                      border-radius: 8px;
                    "
                    class="mb-5 mt-3 mx-10"
                  >
                    <thead>
                      <tr>
                        <th class="text-left">
                          {{ $t('trans.printOptions.fileName') }}
                        </th>
                        <th class="text-left">
                          {{ $t('trans.printOptions.uploadDate') }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{{ defaultTemplateFilename }}</td>
                        <td>{{ defaultTemplateDate }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                  <!-- dropdown list -->
                  <v-select
                    v-if="selectedOption === 'default'"
                    v-model="templateForm.outputFileType"
                    variant="outlined"
                    :items="defaultExportFileTypes"
                    :label="$t('trans.printOptions.selectExportFileType')"
                    style="width: 220px"
                    class="mx-10"
                  />
                </v-skeleton-loader>

                <!-- Radio 2 -->
                <v-radio
                  :label="$t('trans.printOptions.uploadCdogsTemplate')"
                  value="upload"
                ></v-radio>
                <v-file-input
                  ref="fileInput"
                  :key="fileInputKey"
                  v-model="templateForm.files"
                  :class="{ label: isRTL }"
                  :style="isRTL ? { gap: '10px' } : null"
                  counter
                  :clearable="true"
                  :label="$t('trans.printOptions.uploadTemplateFile')"
                  persistent-hint
                  required
                  mandatory
                  show-size
                  prepend-icon="false"
                  :lang="locale"
                  :rules="validationRules"
                  :disabled="selectedOption !== 'upload'"
                  @update:model-value="handleFileUpload"
                />
                <v-select
                  v-if="selectedOption === 'upload'"
                  v-model="templateForm.outputFileType"
                  variant="outlined"
                  :items="uploadExportFileTypes"
                  label="Select export filetype"
                  style="width: 220px"
                  class="mx-10"
                >
                </v-select>
              </v-radio-group>
              <v-card-actions>
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <div class="flex-container">
                      <v-btn
                        id="file-input-submit"
                        variant="flat"
                        class="btn-file-input-submit px-4"
                        :disabled="
                          !displayTemplatePrintButton ||
                          !isValidFile ||
                          !isValidSize
                        "
                        color="primary"
                        :loading="loading"
                        v-bind="props"
                        :title="$t('trans.printOptions.templatePrint')"
                        @click="generate"
                      >
                        <v-icon
                          :start="$vuetify.display.smAndUp"
                          icon="mdi:mdi-content-save"
                        />
                        <span :lang="locale">{{
                          $t('trans.printOptions.templatePrint')
                        }}</span>
                      </v-btn>
                      <v-btn
                        variant="outlined"
                        color="textLink"
                        :class="isRTL ? 'ml-5' : 'mr-5'"
                        :title="$t('trans.formSubmission.cancel')"
                        @click="dialog = false"
                      >
                        <span :lang="locale">{{
                          $t('trans.formSubmission.cancel')
                        }}</span>
                      </v-btn>

                      <a
                        href="https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/CDOGS-Template-Upload/"
                        target="_blank"
                        class="more-info-link"
                        :lang="locale"
                        :title="$t('trans.printOptions.moreInfo')"
                      >
                        <v-icon size="small" class="mx-1"
                          >mdi-help-circle</v-icon
                        >
                        {{ $t('trans.printOptions.moreInfo') }}
                      </a>
                    </div>
                  </template>
                  <span :lang="locale">{{
                    $t('trans.printOptions.submitButtonTxt')
                  }}</span>
                </v-tooltip>
              </v-card-actions>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </span>
</template>

<style scoped>
.more-info-link {
  color: gray;
  text-decoration: none;
  align-items: center;
  margin-top: 4px;
}

.more-info-link:hover {
  text-decoration: underline;
}

.flex-container {
  display: flex;
  justify-content: flex-start;
}
</style>
