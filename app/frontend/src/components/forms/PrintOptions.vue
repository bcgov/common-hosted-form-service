<script>
import { mapState, mapActions } from 'pinia';
import { i18n } from '~/internationalization';
import { formService, utilsService } from '~/services';
import { NotificationTypes } from '~/utils/constants';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
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
  },
  data() {
    return {
      dialog: false,
      loading: false,
      templateForm: {
        files: [],
        contentFileType: null,
        outputFileName: '',
        outputFileType: null,
      },
      expandedText: false,
      timeout: undefined,
      tab: 'tab-1',
      selectedOption: 'upload',
      defaultTemplate: false,
      defaultTemplateContent: null,
      defaultTemplateDate: '',
      defaultTemplateFilename: '',
      defaultTemplateExtension: '',
      defaultReportname: '',
      displayTemplatePrintButton: false,
      isValidFile: true,
      validFileExtensions: ['txt', 'docx', 'html', 'odt', 'pptx', 'xlsx'],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang', 'form', 'getInitialForm']),
    files() {
      return this.templateForm.files;
    },
    formId() {
      return this.f ? this.f : this.form.id;
    },
    validationRules() {
      return [
        this.isValidFile || i18n.t('trans.documentTemplate.invalidFileMessage'),
      ];
    },
  },
  watch: {
    files() {
      if (
        this.templateForm.files.length === null ||
        this.templateForm.files.length === 0
      ) {
        this.displayTemplatePrintButton = false;
      }
      if (
        this.templateForm?.files &&
        this.templateForm.files[0] instanceof File
      ) {
        this.displayTemplatePrintButton = true;
        const { name, extension } = this.splitFileName(
          this.templateForm.files[0].name
        );
        if (!this.templateForm.outputFileName) {
          this.templateForm.outputFileName = name;
        }
        this.templateForm.contentFileType = extension;
      }
    },
    selectedOption() {
      if (this.selectedOption === 'default') {
        this.displayTemplatePrintButton = true;
      } else {
        this.displayTemplatePrintButton = false;
      }
    },
  },
  beforeUnmount() {
    if (this.timeout) clearTimeout(this.timeout);
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async printBrowser() {
      //handle the 'Download Options' popup (v-dialog)
      this.dialog = false;

      if (this.expandedText) {
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
          this.dialog = true;
        };
      }

      //delaying window.print() so that the 'Download Options' popup isn't rendered
      setTimeout(() => window.print(), 500);
    },

    splitFileName(filename = undefined) {
      let name = undefined;
      let extension = undefined;

      if (filename) {
        const filenameArray = filename.split('.');
        name = filenameArray.slice(0, -1).join('.');
        extension = filenameArray.slice(-1).join('.');
      }

      return { name, extension };
    },

    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.replace(/^.*,/, ''));
        reader.onerror = (error) => reject(error);
      });
    },

    getDispositionFilename(disposition) {
      return disposition
        ? disposition.substring(disposition.indexOf('filename=') + 9)
        : undefined;
    },
    createDownload(blob, filename = undefined) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    },

    async generate() {
      try {
        this.loading = true;
        const outputFileType = 'pdf';
        let content = '';
        let contentFileType = '';
        let outputFileName = '';

        if (this.selectedOption === 'default') {
          content = this.defaultTemplateContent;
          contentFileType = this.defaultTemplateExtension;
          outputFileName = this.defaultReportname;
        } else if (this.selectedOption === 'upload') {
          content = await this.fileToBase64(this.templateForm.files[0]);
          contentFileType = this.templateForm.contentFileType;
          outputFileName = this.templateForm.outputFileName;
        }

        const body = this.createBody(
          content,
          contentFileType,
          outputFileName,
          outputFileType
        );
        let response = null;
        // Submit Template to CDOGS API
        if (this.submissionId?.length > 0) {
          response = await formService.docGen(this.submissionId, body);
        } else {
          const draftData = {
            template: body,
            submission: this.submission,
          };
          response = await utilsService.draftDocGen(draftData);
        }
        // create file to download
        const filename = this.getDispositionFilename(
          response.headers['content-disposition']
        );

        const blob = new Blob([response.data], {
          type: 'attachment',
        });

        // Generate Temporary Download Link
        this.createDownload(blob, filename);
        this.addNotification({
          text: i18n.t('trans.printOptions.docGrnSucess'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.printOptions.failedDocGenErrMsg'),
          consoleError: i18n.t('trans.printOptions.failedDocGenErrMsg', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },
    createBody(content, contentFileType, outputFileName, outputFileType) {
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
    },
    async fetchDefaultTemplate() {
      // Calling the API to check whether the form has any uploaded document templates
      this.loading = true;
      try {
        const response1 = await formService.documentTemplateList(this.formId);
        if (response1 && response1.data.length > 0) {
          this.defaultTemplate = true;
          this.selectedOption = 'default';
        }
        if (this.defaultTemplate) {
          const docId = response1.data[0].id;
          const response2 = await formService.documentTemplateRead(
            this.formId,
            docId
          );
          const temp = response2.data.template.data;
          const base64String = temp
            .map((code) => String.fromCharCode(code))
            .join('');
          this.defaultTemplateContent = base64String;
          this.defaultTemplateFilename = response1.data[0].filename;
          const { name, extension } = this.splitFileName(
            response2.data.filename
          );
          this.defaultTemplateExtension = extension;
          this.defaultReportname = name;
          this.defaultTemplateDate = response2.data.createdAt.split('T')[0];
        }
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.documentTemplate.fetchError'),
          consoleError: i18n.t('trans.documentTemplate.fetchError', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },
    validateFileExtension(event) {
      if (event.length > 0) {
        const fileExtension = event[0].name.split('.').pop();
        if (this.validFileExtensions.includes(fileExtension)) {
          this.isValidFile = true;
        } else {
          this.isValidFile = false;
        }
      } else {
        this.isValidFile = true;
      }
    },
  },
};
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
          @click="dialog = true"
        />
      </template>
      <span :lang="lang">{{ $t('trans.printOptions.print') }}</span>
    </v-tooltip>

    <v-dialog
      v-model="dialog"
      width="900"
      content-class="export-submissions-dlg"
    >
      <v-card :class="{ 'dir-rtl': isRTL }">
        <v-card-title class="text-h5 pb-0 mt-2" :lang="lang">{{
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
                  @click="printBrowser"
                >
                  <span :lang="lang">{{
                    $t('trans.printOptions.browserPrint')
                  }}</span>
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="textLink"
                  :class="isRTL ? 'ml-5' : 'mr-5'"
                  @click="dialog = false"
                >
                  <span :lang="lang">{{
                    $t('trans.formSubmission.cancel')
                  }}</span>
                </v-btn>
                <!-- More Info Link -->
                <a
                  href="https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Printing-from-a-browser/"
                  target="_blank"
                  class="more-info-link"
                  :lang="lang"
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
                </v-skeleton-loader>

                <!-- Radio 2 -->
                <v-radio
                  :label="$t('trans.printOptions.uploadCdogsTemplate')"
                  value="upload"
                ></v-radio>
                <v-file-input
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
                  :lang="lang"
                  :rules="validationRules"
                  :disabled="selectedOption !== 'upload'"
                  @update:model-value="validateFileExtension($event)"
                />
              </v-radio-group>
              <v-card-actions>
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <div class="flex-container">
                      <v-btn
                        id="file-input-submit"
                        variant="flat"
                        class="btn-file-input-submit px-4"
                        :disabled="!displayTemplatePrintButton || !isValidFile"
                        color="primary"
                        :loading="loading"
                        v-bind="props"
                        @click="generate"
                      >
                        <v-icon
                          :start="$vuetify.display.smAndUp"
                          icon="mdi:mdi-content-save"
                        />
                        <span :lang="lang">{{
                          $t('trans.printOptions.templatePrint')
                        }}</span>
                      </v-btn>
                      <v-btn
                        variant="outlined"
                        color="textLink"
                        :class="isRTL ? 'ml-5' : 'mr-5'"
                        @click="dialog = false"
                      >
                        <span :lang="lang">{{
                          $t('trans.formSubmission.cancel')
                        }}</span>
                      </v-btn>

                      <a
                        href="https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/CDOGS-Template-Upload/"
                        target="_blank"
                        class="more-info-link"
                        :lang="lang"
                      >
                        <v-icon size="small" class="mx-1"
                          >mdi-help-circle</v-icon
                        >
                        {{ $t('trans.printOptions.moreInfo') }}
                      </a>
                    </div>
                  </template>
                  <span :lang="lang">{{
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
