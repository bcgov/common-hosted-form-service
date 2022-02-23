<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn class="mx-1" @click="dialog = true" color="primary" icon v-bind="attrs" v-on="on">
          <v-icon>print</v-icon>
        </v-btn>
      </template>
      <span>Print</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900" content-class="export-submissions-dlg">
      <v-card>
        <v-card-title class="text-h5 pb-0">Download Options</v-card-title>
        <v-card-text>
          <hr />
          <p>
            <strong>1.</strong> <a href="https://github.com/bcgov/common-hosted-form-service/wiki/Printing-from-a-browser" target="blank">Print</a> the page from your browser
          </p>
          <v-btn class="mb-5 mr-5" color="primary" @click="printBrowser">
            <span>Browser Print</span>
          </v-btn>

          <p>
            <strong>2.</strong> Upload a <a href="https://github.com/bcgov/common-hosted-form-service/wiki/CDOGS-Template-Upload" target="blank">CDOGS template</a> to have a structured version
          </p>
          <v-file-input
            counter
            :clearable="true"
            label="Upload template file"
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
                  <span>Template Print</span>
                </v-btn>
              </template>
              <span>Submit to CDOGS and Download</span>
            </v-tooltip>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { mapActions } from 'vuex';
import { formService } from '@/services';
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
      return disposition ? disposition.substring(disposition.indexOf('filename=') + 9) : undefined;
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

        // Submit Template to CDOGS API
        const response = await formService.docGen(this.submissionId, body);

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
          message: 'Document generated successfully',
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          message: 'Failed to generate Document',
          consoleError: `Error submitting template: ${e.message}`,
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
