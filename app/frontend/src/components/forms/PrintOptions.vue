<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          @click="dialog = true"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>print</v-icon>
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
            counter
            :clearable="true"
            :label="$t('trans.printOptions.uploadTemplateFile')"
            persistent-hint
            prepend-icon="attachment"
            required
            mandatory
            show-size
            v-model="templateForm.files"
          />
          <v-card-actions>
            <v-tooltip top>
              <template #activator="{ on }">
                <v-btn
                  color="primary"
                  class="btn-file-input-submit"
                  :disabled="!templateForm.files"
                  id="file-input-submit"
                  :loading="loading"
                  @click="generate"
                  v-on="on"
                >
                  <v-icon :left="$vuetify.breakpoint.smAndUp">save</v-icon>
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

<script>
import { mapActions } from 'vuex';
import { formService, utilsService } from '@/services';
import { NotificationTypes } from '@/utils/constants';

export default {
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
    };
  },
  props: {
    submissionId: String,
    submission: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    files() {
      return this.templateForm.files;
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    async printBrowser() {
      this.dialog = false;
      // Setting a timeout to allow the modal to close before opening the windows print
      setTimeout(() => {
        window.print();
      }, 500);
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

        content = await this.fileToBase64(this.templateForm.files);
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
          message: this.$t('trans.printOptions.docGrnSucess'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          message: this.$t('trans.printOptions.failedDocGenErrMsg'),
          consoleError: this.$t('trans.printOptions.failedDocGenErrMsg', {
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
  watch: {
    files() {
      if (this.templateForm.files && this.templateForm.files instanceof File) {
        const { name, extension } = this.splitFileName(this.files.name);
        if (!this.templateForm.outputFileName) {
          this.templateForm.outputFileName = name;
        }
        this.templateForm.contentFileType = extension;
      }
    },
  },
};
</script>
