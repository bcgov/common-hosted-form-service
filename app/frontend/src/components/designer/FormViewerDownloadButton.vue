<template>
  <div class="file-upload">
    <v-row>
      <BaseInfoCard v-if="json_csv.data" class="mb-4">
        <h4 class="primary--text"><v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!</h4>
        <p class="my-2">
          In order to successfully complete bulk submissions, please download the instructions and the template.
          <span class="link">
            <vue-blob-json-csv
              tag-name="i"
              file-type="json"
              :file-name="json_csv.file_name"
              title="Download   "
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
      <div v-if="!file" class="drop-zone" @click="handleFile" v-cloak @drop.prevent="addFile($event, 0)" @dragover.prevent>
        <v-icon class="mr-1" color="#003366">upload</v-icon>
        <h1>Select JSON file to upload</h1>
        <p>or drag and drop it here</p>
        <input class="drop-zone__input" ref="file" accept=".json" type="file" @change="addFile($event, 1)" name="file" />
      </div>
      <div v-if="file" class="worker-zone">
        <div class="wz-top">
          <v-progress-linear v-model="value" color="blue-grey" height="25">
            <template v-slot:default="{ value }">
              <strong>{{ value }}%</strong>
            </template>
          </v-progress-linear>
          <v-row class="fileinfo">
            <v-col cols="12" md="6">
              <label class="label-left">{{ file.name }}</label>
            </v-col>
            <v-col cols="12" md="6">
              <label class="label-right">{{ fileSize }}</label>
            </v-col>
          </v-row>
        </div>
        <div class="wz-bottom">
          <div class="message-block" v-if="!progress && response.upload_state == 10">
            <span>Report: </span>
            <p :class="txt_color">
              <v-icon v-if="response.error" color="red">close</v-icon>
              <v-icon v-if="!response.error" color="green">check</v-icon>
              {{ response.message }}
            </p>
            <ul v-if="response.error && response.response.length > 0" class="list-error">
              <li v-for="item in response.response" v-bind:key="item.index">
                Submission {{ item.index + 1 }}
                <ul v-if="item.errors.length > 0">
                  <li v-for="(error, index) in item.errors" v-bind:key="index">({{ error.context.key }})-{{ error.message }}</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <v-row v-if="file && !progress">
          <v-col cols="12" md="12">
            <span class="m-2 pull-right">
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
import { mapActions, mapGetters } from 'vuex';
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
      ERROR: {
        UPLOAD_MULTIPLE_FILE_ERROR: 'Sorry, you can upload only one file',
        DRAG_MULPLE_FILE_ERROR: 'Sorry, you can drag only one file',
        FILE_FORMAT_ERROR: 'Sorry, we only accept json files',
        FILE_SIZE_ERROR: 'Max file size allowed is 5MB',
        PARSE_JSON_ERROR: 'An unexpected error occurred',
        JSON_OBJECT_NOT_ARRAY: 'An unexpected error occurred.',
        JSON_ARRAY_EMPTY: 'This json file is empty.',
        ERROR_WHILE_VALIDATE: 'There is something wrong with this file',
        ERROR_WHILE_CHECKVALIDITY: 'There is something wrong with this file',
        ERROR_AFTER_VALIDATE: 'Some errors found, see below for more information.',
      },
    };
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'token', 'tokenParsed', 'user']),
    txt_color() {
      if (!this.error) return 'success-text';
      else return 'fail-text';
    },
    fileSize() {
      if (this.file.size < 1024) return this.file.size.toFixed(2) + ' bytes';
      if (this.file.size < 1024 * 1024) return (this.file.size / 1024).toFixed(2) + ' KB';
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
        this.addNotification({ message: this.ERROR.UPLOAD_MULTIPLE_FILE_ERROR, consoleError: this.ERROR.UPLOAD_MULTIPLE_FILE_ERROR });
        return;
      }
      let droppedFiles = type == 0 ? e.dataTransfer.files : this.$refs.file.files;

      if (!droppedFiles) return;

      if (droppedFiles.length > 1) {
        this.addNotification({ message: this.ERROR.DRAG_MULPLE_FILE_ERROR, consoleError: this.ERROR.DRAG_MULPLE_FILE_ERROR });
        return;
      }
      if (droppedFiles[0]['type'] != 'application/json') {
        this.addNotification({ message: this.ERROR.FILE_FORMAT_ERROR, consoleError: this.ERROR.FILE_FORMAT_ERROR });
        return;
      }
      let size = droppedFiles[0] / (1024 * 1024);
      if (size > 5) {
        this.addNotification({ message: this.ERROR.FILE_SIZE_ERROR, consoleError: this.ERROR.FILE_SIZE_ERROR });
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
        this.addNotification({ message: this.ERROR.PARSE_JSON_ERROR, consoleError: e });
      }
    },
    preValidateSubmission() {
      try {
        if (!Array.isArray(this.Json)) {
          this.resetUpload();
          this.addNotification({ message: this.ERROR.JSON_OBJECT_NOT_ARRAY, consoleError: 'An unexpected error occurred.' });
          return;
        }
        if (this.Json.length == 0) {
          this.resetUpload();
          this.addNotification({ message: this.ERROR.JSON_ARRAY_EMPTY, consoleError: 'this file is empty.' });
          return;
        }
        this.globalError = [];
        this.index = 0;
        this.max = 100;
        this.progress = true;
        this.validate(this.Json[this.index]);
      } catch (error) {
        this.resetUpload();
        this.$emit('set-error', { error: true, message: this.ERROR.ERROR_WHILE_VALIDATE });
        this.addNotification({ message: this.ERROR.ERROR_WHILE_VALIDATE, consoleError: error });
        return;
      }
    },
    validate(element) {
      const timer = setTimeout(
        function () {
          try {
            let validationResult = this.formElement.checkValidity(element);
            if (!validationResult) {
              this.globalError.push({
                index: this.index,
                errors: validationResult.errors,
              });
            }
          } catch (error) {
            this.addNotification({ message: this.ERROR.ERROR_WHILE_CHECKVALIDITY, consoleError: error });
          }
          this.index++;
          this.value = this.pourcentage(this.index);
          clearTimeout(timer);
          if (this.index < this.Json.length) {
            this.validate(this.Json[this.index]);
          } else {
            this.endValidation();
          }
        }.bind(this),
        25
      );
    },
    pourcentage(i) {
      let number_of_submission = this.Json.length;
      if (number_of_submission > 0) {
        return Math.ceil((i * this.max) / number_of_submission);
      }
      return 0;
    },
    endValidation() {
      this.progress = false;
      if (this.globalError.length == 0) {
        this.$emit('save-bulk-data', this.Json);
      } else {
        this.$emit('set-error', { message: this.ERROR.ERROR_AFTER_VALIDATE, error: true, upload_state: 10, response: this.globalError });
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
  created() {},
  beforeUpdate() {},
};
</script>

<style lang="scss" scoped>
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
  .worker-zone {
    position: relative;
    max-width: 38%;
    min-height: 64px;
    padding: 0.05%;
    text-align: center;
    font-family: 'Quicksand', sans-serif;
    font-size: 16px;
    border: 0.5px solid #003366;
    border-radius: 10px;
    box-shadow: -4px 18px 126px -71px rgba(0, 0, 0, 0.62);
    -webkit-box-shadow: -4px 18px 126px -71px rgba(0, 0, 0, 0.62);
    -moz-box-shadow: -4px 18px 126px -71px rgba(0, 0, 0, 0.62);
    .wz-top {
      width: 98%;
      min-height: 48px;
      margin-left: auto;
      margin-right: auto;
      display: inline-block;
      padding: 0;
      padding-top: 2%;
      .fileinfo {
        position: relative;
        width: 100%;
        margin-top: 0.5%;
        padding: 1px;
        label {
          font-size: 12px;
          color: #38598a;
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
    .wz-bottom {
      width: 98%;
      min-height: 48px;
      margin-left: auto;
      margin-right: auto;
      display: inline-block;
      text-align: left;
      margin-bottom: 0;
      .message-block {
        position: relative;
        width: 100%;
        display: inline-block;
        padding: 0;
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
          margin: 0.5%;
          padding: none;
          font-size: 17px;
        }
        p {
          float: right;
          width: 84%;
          margin: 0.5%;
          text-align: left;
          padding: 0;
          font-size: 15px;
          i {
            margin: 0;
            padding: 0;
          }
        }
        .list-error {
          color: #003366;
          font-size: 15px;
          ul {
            li {
              color: #38598a;
              font-size: 12px;
            }
          }
        }
      }
      hr {
        margin: none;
        margin-top: -0.5%;
        margin-bottom: -0.5%;
      }
      .alert-text {
        width: 100%;
        height: 30px;
        display: inline-block;
        padding: 0%;
        margin: 0%;
        font-weight: 300;
        span {
          font-size: 14px;
          font-weight: bold;
          color: #38598a;
        }
      }
    }
  }
  .drop-zone {
    position: relative;
    max-width: 38%;
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
