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
        <v-card-title class="headline pb-0">Printing Options</v-card-title>
        <v-card-text>
          <hr />
          <p>Select a print option.</p>

          <p>You can either print the page from the browser, or upload a Template file to have a structured PDF version of this submission.</p>
          <div v-if="showTemplateUpload">
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
              <v-spacer />
              <v-tooltip top>
                <template v-slot:activator="{ on }">
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
                    <span v-if="$vuetify.breakpoint.smAndUp">Submit</span>
                  </v-btn>
                </template>
                <span>Submit to CDOGS and Download</span>
              </v-tooltip>
            </v-card-actions>
          </div>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 mr-5" color="primary" @click="printBrowser">
            <span>Print via Browser</span>
          </v-btn>
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            @click="showTemplateUpload = !showTemplateUpload"
          >
            <span>Use Template</span>
          </v-btn>
          <v-btn class="mb-5" outlined @click="dialog = false">
            <span>Cancel</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import formService from '@/services/formService';
import { NotificationTypes } from '@/utils/constants';

export default {
  data() {
    return {
      dialog: false,
      showTemplateUpload: false,
      exportFormat: 'csv',
      submissionRecord: {},
      validFileInput: null,
      loading: false,
      templateForm: {
        contexts: '{}',
        contextFiles: null,
        convertToPDF: null,
        files: null,
        templateContent: '',
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
    ...mapGetters('form', ['form']),
    files() {
      return this.templateForm.files;
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    async printBrowser() {
      this.dialog = false;
      setTimeout(() => {
        window.print();
      }, 100);
    },
    toTextObject(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
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
      let filename = undefined;
      if (disposition) {
        filename = disposition.substring(disposition.indexOf('filename=') + 9);
      }
      return filename;
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
        let parsedContexts = '';

        content = await this.fileToBase64(this.templateForm.files);
        contentFileType = this.templateForm.contentFileType;
        outputFileName = this.templateForm.outputFileName;

        const submissionResponse = await formService.getSubmission(
          this.submissionId
        );
        this.submissionRecord = submissionResponse.data.submission;
        parsedContexts = this.submissionRecord.submission.data;

        const body = this.createBody(
          parsedContexts,
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
          message: 'Parsed successfully',
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          message: 'Failed upload Template',
          consoleError: `Error submitting template: ${e.message}`,
        });
      } finally {
        this.loading = false;
      }
    },
    createBody(
      contexts,
      content,
      contentFileType,
      outputFileName,
      outputFileType
    ) {
      return {
        data: contexts,
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
