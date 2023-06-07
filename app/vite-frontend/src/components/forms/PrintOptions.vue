<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '~/store/notification';
import { formService, utilsService } from '~/services';
import { NotificationTypes } from '~/utils/constants';

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
  submission: {
    type: Object,
    default: undefined,
  },
});

const { t } = useI18n({ useScope: 'global' });

const notificationStore = useNotificationStore();

const dialog = ref(false);
const loading = ref(false);
const templateForm = ref({
  files: null,
  contentFileType: null,
  outputFileName: '',
  outputFileType: null,
});

const files = computed(() => templateForm.value.files);

watch(files, () => {
  if (templateForm.value.files && templateForm.value.files instanceof File) {
    const { name, extension } = splitFileName(files.value.name);
    if (!templateForm.value.outputFileName) {
      templateForm.value.outputFileName = name;
    }
    templateForm.value.contentFileType = extension;
  }
});

async function printBrowser() {
  dialog.value = false;
  // Setting a timeout to allow the modal to close before opening the windows print
  setTimeout(() => {
    window.print();
  }, 500);
}

function splitFileName(filename = undefined) {
  let name = undefined;
  let extension = undefined;

  if (filename) {
    const filenameArray = filename.split('.');
    name = filenameArray.slice(0, -1).join('.');
    extension = filenameArray.slice(-1).join('.');
  }

  return { name, extension };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.replace(/^.*,/, ''));
    reader.onerror = (error) => reject(error);
  });
}

function getDispositionFilename(disposition) {
  return disposition
    ? disposition.substring(disposition.indexOf('filename=') + 9)
    : undefined;
}

function createDownload(blob, filename = undefined) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

async function generate() {
  try {
    loading.value = true;
    const outputFileType = 'pdf';
    let content = '';
    let contentFileType = '';
    let outputFileName = '';

    content = await fileToBase64(templateForm.value.files);
    contentFileType = templateForm.value.contentFileType;
    outputFileName = templateForm.value.outputFileName;

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
    const filename = getDispositionFilename(
      response.headers['content-disposition']
    );

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
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          icon
          size="small"
          v-bind="props"
          @click="dialog = true"
        >
          <v-icon icon="mdi:mdi-printer"></v-icon>
        </v-btn>
      </template>
      <span>{{ $t('trans.printOptions.print') }}</span>
    </v-tooltip>

    <v-dialog
      v-model="dialog"
      width="900"
      content-class="export-submissions-dlg"
    >
      <v-card>
        <v-card-title class="text-h5 pb-0">{{
          $t('trans.printOptions.downloadOptions')
        }}</v-card-title>
        <v-card-text>
          <hr />
          <p>
            <strong>1. </strong>
            <a
              href="https://github.com/bcgov/common-hosted-form-service/wiki/Printing-from-a-browser"
              target="blank"
              >{{ $t('trans.printOptions.print') }}</a
            >
            {{ $t('trans.printOptions.pageFromBrowser') }}
          </p>
          <v-btn class="mb-5 mr-5" color="primary" @click="printBrowser">
            <span>{{ $t('trans.printOptions.browserPrint') }}</span>
          </v-btn>

          <p>
            <strong>2.</strong> {{ $t('trans.printOptions.uploadA') }}
            <a
              href="https://github.com/bcgov/common-hosted-form-service/wiki/CDOGS-Template-Upload"
              target="blank"
              >{{ $t('trans.printOptions.cDogsTemplate') }}</a
            >
            {{ $t('trans.printOptions.uploadB') }}
          </p>
          <v-file-input
            v-model="templateForm.files"
            counter
            :clearable="true"
            :label="$t('trans.printOptions.uploadTemplateFile')"
            persistent-hint
            prepend-icon="attachment"
            required
            mandatory
            show-size
          />
          <v-card-actions>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  id="file-input-submit"
                  color="primary"
                  class="btn-file-input-submit"
                  :disabled="!templateForm.files"
                  :loading="loading"
                  v-bind="props"
                  @click="generate"
                >
                  <v-icon :start="$vuetify.display.smAndUp">save</v-icon>
                  <span>{{ $t('trans.printOptions.templatePrint') }}</span>
                </v-btn>
              </template>
              <span>{{ $t('trans.printOptions.submitButtonTxt') }}</span>
            </v-tooltip>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </span>
</template>
