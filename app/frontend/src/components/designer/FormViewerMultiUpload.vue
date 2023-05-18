<template>
  <div class="file-upload">
    <v-row>
      <BaseInfoCard v-if="json_csv.data" class="mb-4">
        <h4 class="primary--text">
          <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
        </h4>
        <p class="my-2">
          To ensure successful uploading of multiple drafts, please download and
          utilize the provided template.
          <span class="link">
            <vue-blob-json-csv
              tag-name="b"
              file-type="json"
              :file-name="json_csv.file_name"
              title="Download "
              :data="json_csv.data"
              confirm="Do you want to download it?"
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
        <h1>Select JSON file to upload</h1>
        <p>or drag and drop it here</p>
        <input
          class="drop-zone__input"
          ref="file"
          accept=".json"
          type="file"
          @change="addFile($event, 1)"
          name="file"
        />
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
              <strong>{{ value }}%</strong>
            </template>
          </v-progress-linear>
          <v-row class="fileinfo">
            <v-col cols="12" md="12">
              <label class="label-left">{{ file.name }}</label>
              <label class="label-right">{{ fileSize }}</label>
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
              Please download the draft submission report and ensure that the
              data is entered correctly.
              <br />
              <span class="link">
                <vue-blob-json-csv
                  tag-name="b"
                  file-type="csv"
                  :file-name="response.file_name"
                  title="Download report "
                  :data="response.response"
                  confirm="Do you want to download it?"
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
                <span>Upload new file</span>
              </v-btn>
            </span>
          </v-col>
        </v-row>
      </div>
    </v-row>
  </div>
</template>
<script>
import { mapActions } from 'vuex';
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
      ERROR: {
        UPLOAD_MULTIPLE_FILE_ERROR: 'Sorry, you can upload only one file',
        DRAG_MULPLE_FILE_ERROR: 'Sorry, you can drag only one file',
        FILE_FORMAT_ERROR: 'Sorry, we only accept json files',
        FILE_SIZE_ERROR: 'Max file size allowed is 5MB',
        PARSE_JSON_ERROR: 'We can not parse json data from the file',
        JSON_OBJECT_NOT_ARRAY: 'Wrong json file format',
        JSON_ARRAY_EMPTY: 'This json file is empty.',
        ERROR_WHILE_VALIDATE: 'There is something wrong with this file',
        ERROR_WHILE_CHECKVALIDITY: 'There is something wrong with this file',
        ERROR_AFTER_VALIDATE:
          'Some errors found, see below for more information.',
      },
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
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    addFile(e, type) {
      if (this.block) {
        return;
      }

      if (this.file != undefined) {
        this.addNotification({
          message: this.ERROR.UPLOAD_MULTIPLE_FILE_ERROR,
          consoleError: this.ERROR.UPLOAD_MULTIPLE_FILE_ERROR,
        });
        return;
      }
      let droppedFiles = type == 0 ? e.dataTransfer.files : e.target.files;
      if (!droppedFiles || droppedFiles == undefined) return;

      if (droppedFiles.length > 1) {
        this.addNotification({
          message: this.ERROR.DRAG_MULPLE_FILE_ERROR,
          consoleError: this.ERROR.DRAG_MULPLE_FILE_ERROR,
        });
        return;
      }
      if (droppedFiles[0]['type'] != 'application/json') {
        this.addNotification({
          message: this.ERROR.FILE_FORMAT_ERROR,
          consoleError: this.ERROR.FILE_FORMAT_ERROR,
        });
        return;
      }
      let size = droppedFiles[0].size / (1024 * 1024);
      if (size > this.max_file_size) {
        this.addNotification({
          message: this.ERROR.FILE_SIZE_ERROR,
          consoleError: this.ERROR.FILE_SIZE_ERROR,
        });
        return;
      }
      this.file = droppedFiles[0];
      this.parseFile();
    },
    handleFile() {
      if (this.file == undefined) {
        this.$refs.file.click();
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
        reader.onload = function (e) {
          this.Json = JSON.parse(e.target.result);
        }.bind(this);

        reader.onloadend = () => {
          this.preValidateSubmission();
        };
        reader.readAsText(this.file);
      } catch (e) {
        this.resetUpload();
        this.addNotification({
          message: this.ERROR.PARSE_JSON_ERROR,
          consoleError: e,
        });
      }
    },
    preValidateSubmission() {
      try {
        if (!Array.isArray(this.Json)) {
          this.resetUpload();
          this.addNotification({
            message: this.ERROR.JSON_OBJECT_NOT_ARRAY,
            consoleError: 'An unexpected error occurred.',
          });
          return;
        }
        if (this.Json.length == 0) {
          this.resetUpload();
          this.addNotification({
            message: this.ERROR.JSON_ARRAY_EMPTY,
            consoleError: 'this file is empty.',
          });
          return;
        }
        this.globalError = [];
        this.index = 0;
        this.max = 100;
        this.progress = true;
        this.validate(this.Json[this.index], []);
      } catch (error) {
        this.resetUpload();
        this.$emit('set-error', {
          error: true,
          message: this.ERROR.ERROR_WHILE_VALIDATE,
        });
        this.addNotification({
          message: this.ERROR.ERROR_WHILE_VALIDATE,
          consoleError: error,
        });
        return;
      }
    },
    validate(element, errors) {
      const timer = setTimeout(
        function () {
          try {
            let newForm = this.formElement;
            newForm.data = element;
            newForm.submission.data = element;
            newForm.triggerChange();
            let validationResult = newForm.checkValidity();
            if (!validationResult) {
              errors.push({
                submission: this.index,
                errors: validationResult.errors,
              });
            }
          } catch (error) {
            errors.push({
              submission: this.index,
              message: this.ERROR.ERROR_WHILE_CHECKVALIDITY,
            });
          }
          this.index++;
          this.value = this.pourcentage(this.index);
          clearTimeout(timer);
          if (this.index < this.Json.length) {
            this.validate(this.Json[this.index], errors);
          } else {
            this.endValidation(errors);
          }
        }.bind(this),
        12
      );
    },
    pourcentage(i) {
      let number_of_submission = this.Json.length;
      if (number_of_submission > 0) {
        return Math.ceil((i * this.max) / number_of_submission);
      }
      return 0;
    },
    endValidation(errors) {
      this.progress = false;
      this.globalError = errors;
      if (this.globalError.length == 0) {
        this.$emit('save-bulk-data', this.Json);
      } else {
        this.$emit('set-error', {
          message: this.ERROR.ERROR_AFTER_VALIDATE,
          error: true,
          upload_state: 10,
          response: this.globalError,
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
      this.report = ['test'];
      this.index = 0;
      this.globalError = [];
      this.progress = false;
      this.$emit('reset-message');
    },
  },
};
</script>

<style lang="scss" scoped>
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
      //border: 1px solid #003366;
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
