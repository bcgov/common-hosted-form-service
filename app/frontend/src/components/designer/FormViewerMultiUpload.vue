<script>
import { mapActions, mapState } from 'pinia';
import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import { i18n } from '~/internationalization';
import { useAppStore } from '~/store/app';
import { useNotificationStore } from '~/store/notification';

export default {
  components: {
    BaseInfoCard,
  },
  props: {
    formElement: undefined,
    form: {
      type: Object,
      default: () => {},
    },
    formSchema: {
      type: Object,
      default: () => {},
    },
    formFields: {
      type: Array,
      default: () => [],
    },
    block: Boolean,
    response: {
      type: Object,
      default: () => {
        return {
          message: '',
          error: false,
          upload_state: 0,
          response: [],
          file_name: '',
        };
      },
    },
    jsonCsv: {
      type: Object,
      default: () => {
        return {
          data: [],
          file_name: '',
        };
      },
    },
  },
  emits: ['reset-message', 'save-bulk-data', 'set-error', 'toggleBlock'],
  data() {
    return {
      file: undefined,
      Json: [],
      percent: 0,
      max: 100,
      upload_state: 0,
      index: 0,
      globalError: [],
      progress: false,
    };
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    txt_colour() {
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
    ...mapActions(useNotificationStore, ['addNotification']),
    download(filename, data) {
      if (
        window.confirm(i18n.t('trans.formViewerMultiUpload.confirmDownload'))
      ) {
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    },

    addFile(e, type) {
      if (this.block) {
        return;
      }

      if (this.file != undefined) {
        this.addNotification({
          text: i18n.t('trans.formViewerMultiUpload.uploadMultipleFileErr'),
          consoleError: i18n.t(
            'trans.formViewerMultiUpload.uploadMultipleFileErr'
          ),
        });
        return;
      }
      try {
        let files = type == 0 ? e.dataTransfer.files : e.target.files;

        if (!files || files == undefined) return;

        if (files.length > 1) {
          this.addNotification({
            text: i18n.t('trans.formViewerMultiUpload.dragMultipleFileErr'),
            consoleError: i18n.t(
              'trans.formViewerMultiUpload.dragMultipleFileErr'
            ),
          });
          return;
        }

        if (files[0]['type'] != 'application/json') {
          this.addNotification({
            text: i18n.t('trans.formViewerMultiUpload.fileFormatErr'),
            consoleError: i18n.t('trans.formViewerMultiUpload.fileFormatErr'),
          });
          return;
        }
        if (files[0].size > this.config.uploads.fileMaxSizeBytes) {
          this.addNotification({
            text: i18n.t('trans.formViewerMultiUpload.fileSizeErr'),
            consoleError: i18n.t('trans.formViewerMultiUpload.fileSizeErr'),
          });
          return;
        }
        this.file = files[0];
        this.parseFile();
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.formViewerMultiUpload.dragMultipleFileErr'),
          consoleError:
            i18n.t('trans.formViewerMultiUpload.dragMultipleFileErr') +
            `${error}`,
        });
        return;
      }
    },
    handleFile() {
      if (this.file == undefined) {
        this.$refs.fileRef.click();
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
          text: i18n.t('trans.formViewerMultiUpload.parseJsonErr'),
          consoleError: e,
        });
      }
    },

    preValidateSubmission() {
      try {
        if (!Array.isArray(this.Json)) {
          this.resetUpload();
          this.addNotification({
            text: i18n.t('trans.formViewerMultiUpload.jsonObjNotArray'),
            consoleError: i18n.t(
              'trans.formViewerMultiUpload.jsonObjNotArrayConsErr'
            ),
          });
          return;
        }
        if (this.Json.length == 0) {
          this.resetUpload();
          this.addNotification({
            text: i18n.t('trans.formViewerMultiUpload.jsonArrayEmpty'),
            consoleError: i18n.t('trans.formViewerMultiUpload.fileIsEmpty'),
          });
          return;
        }
        this.globalError = [];
        this.index = 0;
        this.max = 100;
        this.progress = true;
        this.$emit('toggleBlock', true);
        this.validate(this.Json[this.index], []);
      } catch (error) {
        this.resetUpload();
        this.$emit('set-error', {
          error: true,
          text: i18n.t('trans.formViewerMultiUpload.errorWhileValidate'),
        });
        this.addNotification({
          text: i18n.t('trans.formViewerMultiUpload.errorWhileValidate'),
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
              text: i18n.t('trans.formViewerMultiUpload.errWhileCheckValidity'),
            });
          }
          this.index++;
          this.percent = this.percentage(this.index);
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

    percentage(i) {
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
        this.$emit('toggleBlock', false);
        this.$emit('set-error', {
          text: i18n.t('trans.formViewerMultiUpload.errAfterValidate'),
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
      this.percent = 0;
      this.upload_state = 0;
      this.index = 0;
      this.globalError = [];
      this.progress = false;
      this.$emit('reset-message');
    },
  },
};
</script>

<template>
  <v-container fluid class="file-upload">
    <BaseInfoCard v-if="jsonCsv.data" class="mb-4">
      <h4 class="text-primary">
        <v-icon class="mr-1" color="primary" icon="mdi:mdi-information"></v-icon
        >{{ $t('trans.formViewerMultiUpload.important') }}!
      </h4>
      <p class="my-2">
        {{ $t('trans.formViewerMultiUpload.uploadSucessMsg') }}
        <span class="link">
          <a @click="download(jsonCsv.file_name, jsonCsv.data)">{{
            $t('trans.formViewerMultiUpload.download')
          }}</a>
          <v-icon class="mr-1" color="#003366" icon="mdi:mdi-download"></v-icon>
        </span>
      </p>
    </BaseInfoCard>
  </v-container>
  <v-container fluid>
    <h3>{{ form.name }}</h3>
    <div
      v-if="!file"
      v-cloak
      class="drop-zone"
      @click="handleFile"
      @drop.prevent="addFile($event, 0)"
      @dragover.prevent
    >
      <v-icon class="mr-1" color="#003366" icon="mdi:mdi-upload" />
      <h1>{{ $t('trans.formViewerMultiUpload.jsonFileUpload') }}</h1>
      <p>{{ $t('trans.formViewerMultiUpload.dragNDrop') }}</p>

      <v-file-input
        ref="fileRef"
        class="drop-zone__input"
        accept="application/json"
        name="file"
        :label="$t('trans.formViewerMultiUpload.chooseAFile')"
        show-size
        @change="addFile($event, 1)"
      >
      </v-file-input>
    </div>
    <div v-if="file" class="worker-zone">
      <div class="wz-top">
        <v-progress-linear
          v-model="percent"
          class="loading"
          rounded
          height="15"
        >
          <template #default="{ value }">
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
          v-if="!progress && response.upload_state == 10"
          cols="12"
          md="12"
          class="message-block"
        >
          <hr v-if="response.error" />
          <span>Report: </span>
          <p :class="txt_colour">
            <v-icon v-if="response.error" color="red" icon="mdi:mdi-close" />
            <v-icon v-if="!response.error" color="green" icon="mdi:mdi-check" />
            {{ response.message }}
          </p>
        </v-col>
        <v-col cols="12" md="12">
          <p
            v-if="response.error && response.response.length > 0"
            style="text-align: justify; line-height: 1.2"
          >
            {{ $t('trans.formViewerMultiUpload.downloadDraftSubmns') }}
            <br />
            <span class="link">
              <a @click="download(response.file_name, response.response)">{{
                $t('trans.formViewerMultiUpload.downloadReport')
              }}</a>
              <v-icon
                class="mr-1"
                color="#003366"
                icon="mdi:mdi-download"
              ></v-icon>
            </span>
          </p>
        </v-col>
        <v-col
          v-if="
            file && !progress && response.error && response.response.length > 0
          "
          cols="12"
          md="12"
        >
          <span class="m-1 pull-right">
            <v-btn color="primary" @click="resetUpload">
              <span>{{ $t('trans.formViewerMultiUpload.uploadNewFile') }}</span>
            </v-btn>
          </span>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

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
    color: #003366;
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
