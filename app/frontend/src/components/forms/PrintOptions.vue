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
  },
  data() {
    return {
      dialog: false,
      loading: false,
      templateForm: {
        files: null,
        contentFileType: null,
        outputFileName: '',
        outputFileType: null,
      },
      timeout: undefined,
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    files() {
      return this.templateForm.files;
    },
  },
  watch: {
    files() {
      if (
        this.templateForm?.files &&
        this.templateForm.files[0] instanceof File
      ) {
        const { name, extension } = this.splitFileName(
          this.templateForm.files[0].name
        );
        if (!this.templateForm.outputFileName) {
          this.templateForm.outputFileName = name;
        }
        this.templateForm.contentFileType = extension;
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

        content = await this.fileToBase64(this.templateForm.files[0]);
        contentFileType = this.templateForm.contentFileType;
        outputFileName = this.templateForm.outputFileName;

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
        <v-card-title class="text-h5 pb-0" :lang="lang">{{
          $t('trans.printOptions.downloadOptions')
        }}</v-card-title>
        <v-card-text>
          <hr />
          <p :lang="lang">
            <strong>1. </strong>
            <a
              href="https://github.com/bcgov/common-hosted-form-service/wiki/Printing-from-a-browser"
              target="blank"
              :hreflang="lang"
            >
              {{ $t('trans.printOptions.print') }}
            </a>
            {{ $t('trans.printOptions.pageFromBrowser') }}
          </p>
          <v-btn class="mb-5 mr-5" color="primary" @click="printBrowser">
            <span :lang="lang">{{
              $t('trans.printOptions.browserPrint')
            }}</span>
          </v-btn>

          <p :lang="lang">
            <strong>2.</strong> {{ $t('trans.printOptions.uploadA') }}
            <a
              href="https://github.com/bcgov/common-hosted-form-service/wiki/CDOGS-Template-Upload"
              target="blank"
              :hreflang="lang"
            >
              {{ $t('trans.printOptions.cDogsTemplate') }}
            </a>
            {{ $t('trans.printOptions.uploadB') }}
          </p>
          <v-file-input
            v-model="templateForm.files"
            :class="{ label: isRTL }"
            :style="isRTL ? { gap: '10px' } : null"
            counter
            :clearable="true"
            :label="$t('trans.printOptions.uploadTemplateFile')"
            persistent-hint
            prepend-icon="attachment"
            required
            mandatory
            show-size
            :lang="lang"
          />
          <v-card-actions>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  id="file-input-submit"
                  variant="flat"
                  class="btn-file-input-submit px-4"
                  :disabled="!templateForm.files"
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
              </template>
              <span :lang="lang">{{
                $t('trans.printOptions.submitButtonTxt')
              }}</span>
            </v-tooltip>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </span>
</template>
