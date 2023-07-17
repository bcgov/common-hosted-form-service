<template>
  <div class="file-upload">
    <v-row>
      <BaseInfoCard v-if="json_csv.data" class="mb-4">
        <h4 class="primary--text">
          <v-icon class="mr-1" color="primary">info</v-icon
          >{{ $t('trans.formViewerMultiUpload.important') }}!
        </h4>
        <p class="my-2">
          {{ $t('trans.formViewerMultiUpload.uploadSucessMsg') }}
          <span class="link">
            <vue-blob-json-csv
              tag-name="b"
              file-type="json"
              :file-name="json_csv.file_name"
              :title="$t('trans.formViewerMultiUpload.download')"
              :data="json_csv.data"
              :confirm="this.$t('trans.formViewerMultiUpload.confirmDownload')"
            />
            <v-icon class="mr-1" color="#003366">download</v-icon>
          </span>
        </p>
      </BaseInfoCard>
    </v-row>
    <v-row>
      <h3>{{ form.name }}</h3>

      <div
        v-if="!file"
        class="drop-zone"
        @click="handleFile"
        v-cloak
        @drop.prevent="addFile($event, 0)"
        @dragover.prevent
      >
        <v-icon class="mr-1" color="#003366">upload</v-icon>
        <h1>{{ this.$t('trans.formViewerMultiUpload.jsonFileUpload') }}</h1>
        <p>{{ this.$t('trans.formViewerMultiUpload.dragNDrop') }}</p>

        <v-file-input
          class="drop-zone__input"
          ref="file"
          accept=".json"
          type="file"
          @change="addFile($event, 1)"
          name="file"
          :label="this.$t('trans.formViewerMultiUpload.chooseAFile')"
          show-size
        >
        </v-file-input>
      </div>
      <div v-if="file" class="worker-zone">
        <div class="wz-top">
          <v-progress-linear
            v-model="value"
            class="loading"
            rounded
            height="15"
          >
            <template v-slot:default="{ value }">
              <strong>{{ value }}% </strong>
            </template>
          </v-progress-linear>
          <v-row class="fileinfo">
            <v-col cols="12" md="12">
              <label class="label-left" v-bind:title="file.name">{{
                fileName
              }}</label>
              <label class="label-right"
                >{{ fileSize }}
                <p v-if="index > 0 && Json.length > 0">
                  {{ index + '/' + Json.length }}
                </p>
              </label>
            </v-col>
          </v-row>
        </div>
        <v-row class="p-1">
          <v-col
            cols="12"
            md="12"
            class="message-block"
            v-if="!progress && response.upload_state == 10"
          >
            <hr v-if="response.error" />
            <span>Report: </span>
            <p :class="txt_color">
              <v-icon v-if="response.error" color="red">close</v-icon>
              <v-icon v-if="!response.error" color="green">check</v-icon>
              {{ response.message }}
            </p>
          </v-col>
          <v-col cols="12" md="12">
            <p
              style="text-align: justify; line-height: 1.2"
              v-if="response.error && response.response.length > 0"
            >
              {{ this.$t('trans.formViewerMultiUpload.downloadDraftSubmns') }}
              <br />
              <span class="link">
                <vue-blob-json-csv
                  tag-name="b"
                  file-type="csv"
                  :file-name="response.file_name"
                  :title="this.$t('trans.formViewerMultiUpload.downloadReport')"
                  :data="response.response"
                  :confirm="
                    this.$t('trans.formViewerMultiUpload.doYouWantToDownload')
                  "
                />
                <v-icon class="mr-1" color="#003366">download</v-icon>
              </span>
            </p>
          </v-col>
          <v-col
            cols="12"
            md="12"
            v-if="
              file &&
              !progress &&
              response.error &&
              response.response.length > 0
            "
          >
            <span class="m-1 pull-right">
              <v-btn @click="resetUpload" color="primary">
                <span>{{
                  this.$t('trans.formViewerMultiUpload.uploadNewFile')
                }}</span>
              </v-btn>
            </span>
          </v-col>
        </v-row>
      </div>
    </v-row>
    <v-row id="validateForm" class="displayNone"></v-row>
  </div>
</template>
<script>
import { mapActions } from 'vuex';
import { Formio } from 'vue-formio';
// import { nextTick } from 'process';
export default {
  name: 'FormViewerDownloadButton',
  components: {},
  props: {
    formElement: undefined,
    form: {},
    formSchema: {},
    formFields: [],
    block: Boolean,
    response: {
      message: String,
      error: Boolean,
      upload_state: Number,
      response: [],
      file_name: String,
      typeError: Number,
    },
    json_csv: {
      data: [],
      file_name: String,
    },
  },
  data() {
    return {
      vForm: {},
      file: undefined,
      Json: [],
      content: [],
      parsed: false,
      value: 0,
      max: 100,
      upload_state: 0,
      index: 0,
      globalError: [],
      progress: false,
      report_file_name: undefined,
      max_file_size: 5,
    };
  },
  computed: {
    txt_color() {
      if (!this.error) return 'success-text';
      else return 'fail-text';
    },
    fileSize() {
      if (this.file.size < 1024) return this.file.size.toFixed(2) + ' bytes';
      if (this.file.size < 1024 * 1024)
        return (this.file.size / 1024).toFixed(2) + ' KB';
      return (this.file.size / (1024 * 1024)).toFixed(2) + ' MB';
    },
    fileName() {
      try {
        const fs = this.file.name.split('_');
        return fs[0] + '...' + fs[fs.length - 1];
      } catch (e) {
        return this.file.name;
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    addFile(e, type) {
      if (this.block) {
        return;
      }

      if (this.file != undefined) {
        this.addNotification({
          message: this.$t('trans.formViewerMultiUpload.uploadMultipleFileErr'),
          consoleError: this.$t(
            'trans.formViewerMultiUpload.uploadMultipleFileErr'
          ),
        });
        return;
      }
      try {
        let droppedFiles = type == 0 ? e.dataTransfer.files : [e];

        if (!droppedFiles || droppedFiles == undefined) return;

        if (droppedFiles.length > 1) {
          this.addNotification({
            message: this.$t('trans.formViewerMultiUpload.dragMultipleFileErr'),
            consoleError: this.$t(
              'trans.formViewerMultiUpload.dragMultipleFileErr'
            ),
          });
          return;
        }

        if (droppedFiles[0]['type'] != 'application/json') {
          this.addNotification({
            message: this.$t('trans.formViewerMultiUpload.fileFormatErr'),
            consoleError: this.$t('trans.formViewerMultiUpload.fileFormatErr'),
          });
          return;
        }
        let size = droppedFiles[0].size / (1024 * 1024);
        if (size > this.max_file_size) {
          this.addNotification({
            message: this.$t('trans.formViewerMultiUpload.fileSizeErr'),
            consoleError: this.$t('trans.formViewerMultiUpload.fileSizeErr'),
          });
          return;
        }
        this.file = droppedFiles[0];
        this.parseFile();
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.formViewerMultiUpload.dragMultipleFileErr'),
          consoleError:
            this.$t('trans.formViewerMultiUpload.dragMultipleFileErr') +
            `${error}`,
        });
        return;
      }
    },
    handleFile() {
      if (this.file == undefined) {
        this.$refs.file.$refs.input.click();
      }
    },
    removeFile(file) {
      this.files = this.files.filter((f) => {
        return f != file;
      });
    },
    parseFile() {
      try {
        let reader = new FileReader();
        reader.onload = (e) => {
          this.Json = JSON.parse(e.target.result);
        };
        reader.onloadend = this.preValidateSubmission;
        reader.readAsText(this.file);
      } catch (e) {
        this.resetUpload();
        this.addNotification({
          message: this.$t('trans.formViewerMultiUpload.parseJsonErr'),
          consoleError: e,
        });
      }
    },
    async preValidateSubmission() {
      try {
        if (!Array.isArray(this.Json)) {
          this.resetUpload();
          this.addNotification({
            message: this.$t('trans.formViewerMultiUpload.jsonObjNotArray'),
            consoleError: this.$t(
              'trans.formViewerMultiUpload.jsonObjNotArrayConsEr'
            ),
          });
          return;
        }
        if (this.Json.length == 0) {
          this.resetUpload();
          this.addNotification({
            message: this.$t('trans.formViewerMultiUpload.jsonArrayEmpty'),
            consoleError: this.$t('trans.formViewerMultiUpload.fileIsEmpty'),
          });
          return;
        }
        this.globalError = [];
        this.index = 0;
        this.max = 100;
        this.progress = true;
        this.$emit('toggleBlock', true);
        const formHtml = document.getElementById('validateForm');
        this.vForm = await Formio.createForm(formHtml, this.formSchema, {
          highlightErrors: true,
          alwaysDirty: true,
          hide: {
            submit: true,
          },
        });
        this.$nextTick(() => {
          this.validate(this.Json[this.index], []);
        });
      } catch (error) {
        this.resetUpload();
        this.$emit('set-error', {
          error: true,
          message: this.$t('trans.formViewerMultiUpload.errorWhileValidate'),
        });
        this.addNotification({
          message: this.$t('trans.formViewerMultiUpload.errorWhileValidate'),
          consoleError: error,
        });
        return;
      }
    },
    async getMemoryInfo() {
      return new Promise((resolve) => {
        if (window.performance && window.performance.memory) {
          resolve(
            (
              (window.performance.memory.usedJSHeapSize * 100) /
              window.performance.memory.jsHeapSizeLimit
            ).toFixed(0)
          );
        }
        resolve(undefined);
      });
    },
    async checkMemoryUsage() {
      let time = 1000;
      const memoryUsage = await this.getMemoryInfo();
      if (memoryUsage != undefined) {
        if (memoryUsage <= 50) {
          time = 50;
        } else if (memoryUsage > 50 || memoryUsage < 70) {
          time = 1000;
        } else if (memoryUsage > 70 || memoryUsage < 80) {
          time = 2000;
        } else if (memoryUsage > 80) {
          time = 3000;
        }
      }
      return time;
    },
    async validate(element, errors) {
      await this.delay(500);
      //this.checkMemoryUsage();
      this.formIOValidation(element).then((response) => {
        if (response.error) {
          errors[this.index] = {
            submission: this.index,
            errors: response.data,
          };
        }
        delete response.error;
        delete response.data;
        this.vForm.setSubmission({
          data: undefined,
        });
        this.validationDispatcher(errors);
      });
    },
    async validationDispatcher(errors) {
      /* we need this timer allow to the gargabe colector to have time
       to clean the memory before starting  a new form validation */

      this.vForm.clearServerErrors();
      this.vForm.resetValue();
      this.vForm.clear();
      const response = await this.checkMemoryUsage();

      await this.delay(response);
      // if (!response) {
      const check = {
        shouldContinueValidation:
          Number(this.index) < Number(this.Json.length - 1), //Need to compare with JSON length - 1 because we only need to perform validation upto the last instance/object of Json array.
      };
      if (check.shouldContinueValidation) {
        this.$nextTick(() => {
          this.index++;
          this.value = this.percentage(this.index);
        });
        delete check.shouldContinueValidation;
        this.$nextTick(() => {
          this.validate(this.Json[this.index], errors);
        });
      } else {
        this.$nextTick(() => {
          this.index++;
          this.value = this.percentage(this.index);
        });
        this.endValidation(errors);
      }
    },
    async formIOValidation(element) {
      return new Promise((resolve) => {
        this.vForm.setSubmission({
          data: element,
        });
        this.vForm
          .submit()
          .then((submission) => {
            resolve({ error: false, data: submission });
          })
          .catch((error) => {
            resolve({ error: true, data: error });
          });
      });
    },
    delay(ms) {
      return new Promise((resolve) => {
        const c = setTimeout(() => {
          clearTimeout(c);
          resolve();
        }, ms);
      });
    },
    percentage(i) {
      let number_of_submission = this.Json.length;
      if (number_of_submission > 0 && i > 0) {
        return Math.ceil((i * this.max) / number_of_submission);
      }
      return 0;
    },
    endValidation(errors) {
      this.progress = false;
      this.globalError = errors;
      this.vForm.destroy();
      this.vForm = null;
      if (this.globalError.length == 0) {
        this.$emit('save-bulk-data', this.Json);
      } else {
        this.$emit('toggleBlock', false);
        this.$emit('set-error', {
          message: this.$t('trans.formViewerMultiUpload.errAfterValidate'),
          error: true,
          upload_state: 10,
          response: {
            data: {
              title: 'Validation Error',
              reports: this.globalError,
            },
          },
          typeError: 0,
        });
      }
    },
    resetUpload() {
      this.globalError = [];
      this.file = undefined;
      this.Json = [];
      this.value = 0;
      this.upload_state = 0;
      this.error = false;
      this.report = [];
      this.index = 0;
      this.globalError = [];
      this.progress = false;
      this.$emit('reset-message');
    },
  },
};
</script>

<style lang="scss" scoped>
.displayNone,
.formio-error-wrapper {
  display: none !important;
  height: 1px;
  width: 1px;
}
.loading {
  background-color: #5072a6;
  border-color: #003366;
  strong {
    color: white;
    font-size: 13px;
  }
}
.file-upload {
  position: relative;
  width: 100%;
  display: block;
  margin-top: 3%;
  // border: #003366 1px solid;
  h3 {
    width: 100%;
    color: #38598a;
  }
  .link {
    cursor: pointer;
    b {
      color: #003366;
    }
  }
  .worker-zone {
    width: 380px;
    min-height: 150px;
    text-align: center;
    font-family: 'Quicksand', sans-serif;
    font-size: 16px;
    border: 0.5px solid #003366;
    border-radius: 10px;
    box-shadow: -4px 18px 126px -71px rgba(0, 0, 0, 0.62);
    -webkit-box-shadow: -4px 18px 126px -71px rgba(0, 0, 0, 0.62);
    -moz-box-shadow: -4px 18px 126px -71px rgba(0, 0, 0, 0.62);
    display: inline-block;
    .wz-top {
      position: relative;
      width: 370px;
      min-height: 40px;
      margin-left: auto;
      margin-right: auto;
      display: inline-block;
      padding: 0;
      padding-top: 1%;
      .fileinfo {
        margin-top: 0.5%;
        padding-top: 0.5px;
        label {
          font-size: 12px;
          color: #38598a;
          line-height: 100%;
        }
        .label-right {
          text-align: right;
          float: right;
          p {
            color: #38598a;
          }
        }
        .label-left {
          text-align: left;
          float: left;
        }
      }
    }
    .message-block {
      width: 100%;
      height: auto;
      display: inline;
      margin-bottom: -5%;
      hr {
        margin: none;
        margin-top: -4%;
        margin-bottom: 3%;
      }
      .success-text {
        color: #38598a;
      }
      .fail-text {
        color: rgb(233, 50, 78);
      }
      span {
        font-weight: bold;
        color: #003366;
        float: left;
        width: 12%;
        padding: none;
        font-size: 15px;
      }
      p {
        float: right;
        width: 84%;
        margin-top: -0.5%;
        text-align: left;
        padding: 0;
        font-size: 15px;
        i {
          position: relative;
          margin: 0;
          margin-top: -0.5%;
          padding: 0;
          line-height: 100%;
          font-size: 20px;
        }
      }
    }
  }
  .drop-zone {
    position: relative;
    max-width: 380px;
    min-height: 200px;
    padding: 3%;
    text-align: center;
    font-family: 'Quicksand', sans-serif;
    font-size: 17px;
    cursor: pointer;
    color: #cccccc;
    border: 1.5px dashed #053667;
    border-radius: 10px;
    background-color: #eef1ff;
    i {
      font-size: 50px;
    }
    h1 {
      position: relative;
      width: 100%;
      text-align: center;
      font-size: 25px;
      font-weight: small;
      color: #003366;
      display: block;
    }
    p {
      position: relative;
      width: 100%;
      text-align: center;
      font-size: 15px;
      display: block;
      font-weight: bold;
    }
  }
  .drop-zone:hover {
    background-color: #d5d9ea;
  }
  .drop-zone--over {
    border-style: solid;
  }
  .drop-zone__input {
    display: none;
  }
}
</style>
