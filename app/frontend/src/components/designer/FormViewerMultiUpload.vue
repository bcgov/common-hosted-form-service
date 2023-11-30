<script>
import _ from 'lodash';
import { mapActions, mapState } from 'pinia';
import { Formio, Utils } from '@formio/vue';

import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import { i18n } from '~/internationalization';
import { useAppStore } from '~/store/app';
import { useFormStore } from '~/store/form';
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
      globalError: [],
      index: 0,
      Json: [],
      max: 100,
      max_file_size: 5,
      percent: 0,
      progress: false,
      timeout: undefined,
      upload_state: 0,
      vForm: {},
    };
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useFormStore, ['isRTL', 'lang']),

    txt_colour() {
      if (!this.response.error) return 'success-text';
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
  beforeUnmount() {
    if (this.timeout) clearTimeout(this.timeout);
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
          this.Json = this.popFormLevelInfo(JSON.parse(e.target.result));
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
    popFormLevelInfo(jsonPayload = []) {
      /** This function is purely made to remove un-necessery information
       * from the json payload of submissions. It will also help to remove crucial data
       * to be removed from the payload that should not be going to DB like confirmationId,
       * formName,version,createdAt,fullName,username,email,status,assignee,assigneeEmail and
       * lateEntry
       * Example: Sometime end user use the export json file as a bulk
       * upload payload that contains formId, confirmationId and User
       * details as well so we need to remove those details from the payload.
       *
       */
      if (jsonPayload.length) {
        jsonPayload.forEach(function (submission) {
          delete submission.submit;
          delete submission.lateEntry;
          if (Object.prototype.hasOwnProperty.call(submission, 'form')) {
            const propsToRemove = [
              'confirmationId',
              'formName',
              'version',
              'createdAt',
              'fullName',
              'username',
              'email',
              'status',
              'assignee',
              'assigneeEmail',
            ];
            propsToRemove.forEach((key) => delete submission.form[key]);
          }
        });
      }
      return jsonPayload;
    },
    async preValidateSubmission() {
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
        const formHtml = document.getElementById('validateForm');
        //Add custom validation to the Components those are not covered by FormIO Validation class
        await Utils.eachComponent(
          this.formSchema.components,
          function (component) {
            //Need to cover Validation parts those are not performed by FormIO validate funciton
            switch (component.type) {
              case 'number':
                component.validate.custom =
                  "if(component.validate.required === true || input){valid = _.isNumber(input) ? true : 'Only numbers are allowed in a number field.';}" +
                  component.validate.custom;
                break;

              case 'simplenumber':
                component.validate.custom =
                  "if(component.validate.required === true || input){valid = _.isNumber(input) ? true : 'Only numbers are allowed in a simple number field.';}" +
                  component.validate.custom;
                break;

              case 'simplenumberadvanced':
                component.validate.custom =
                  "if(component.validate.required === true || input){valid = _.isNumber(input) ? true : 'Only numbers are allowed in a simple number advanced field.';}" +
                  component.validate.custom;
                break;

              case 'simpledatetimeadvanced':
                component.validate.custom =
                  "if(component.validate.required === true || input){valid = moment(input, _.replace('" +
                  component.widget.format +
                  "','dd','DD'), true).isValid() === true ? true : 'Wrong DateTime format.';}" +
                  component.validate.custom;
                break;

              case 'simpledatetime':
                component.validate.custom =
                  "if(component.validate.required === true || input){valid = moment(input, _.replace('" +
                  component.widget.format +
                  "','dd','DD'), true).isValid() === true ? true : 'Wrong Date/Time format.';}" +
                  component.validate.custom;
                break;

              case 'simpletimeadvanced':
                component.validate.custom =
                  "if(component.validate.required === true || input){valid = moment(input, _.replace('" +
                  component.widget.format +
                  "','dd','DD'), true).isValid() === true ? true : 'Wrong Time format.';}" +
                  component.validate.custom;
                break;

              default:
                break;
            }
          }
        );
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
          text: i18n.t('trans.formViewerMultiUpload.errorWhileValidate'),
        });
        this.addNotification({
          text: i18n.t('trans.formViewerMultiUpload.errorWhileValidate'),
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
    convertEmptyArraysToNull(obj) {
      /*
       * This function is purely made to solve this https://github.com/formio/formio.js/issues/4515 formio bug
       * where setSubmission mislead payload for submission. In our case if setSubmission got triggered multiple
       * time it cache submission key's with old values that leads to trigger false validation errors.
       * This function clear object with some empty arrays to null. Main problem was occured to columns and grids components.
       */

      if (_.isArray(obj)) {
        return obj.length === 0 ? null : obj.map(this.convertEmptyArraysToNull);
      } else if (_.isObject(obj)) {
        return _.mapValues(obj, this.convertEmptyArraysToNull);
      } else {
        return obj;
      }
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
          this.percent = this.percentage(this.index);
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
          data: this.convertEmptyArraysToNull(element),
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
        this.timeout = setTimeout(() => {
          clearTimeout(this.timeout);
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
          text: i18n.t('trans.formViewerMultiUpload.errAfterValidate'),
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
  <div class="file-upload" :class="{ 'dir-rtl': isRTL }">
    <v-container fluid class="file-upload">
      <BaseInfoCard v-if="jsonCsv.data" class="mb-4">
        <h4 class="text-primary" :lang="lang">
          <v-icon
            :class="isRTL ? 'ml-1' : 'mr-1'"
            color="primary"
            icon="mdi:mdi-information"
          ></v-icon
          >{{ $t('trans.formViewerMultiUpload.important') }}!
        </h4>
        <p class="my-2" :lang="lang">
          {{ $t('trans.formViewerMultiUpload.uploadSucessMsg') }}
          <span class="link">
            <a
              :hreflang="lang"
              @click="
                download(
                  jsonCsv.file_name,
                  jsonCsv.data,
                  $t('trans.formViewerMultiUpload.confirmDownload')
                )
              "
              >{{ $t('trans.formViewerMultiUpload.download') }}</a
            >
            <v-icon
              class="mr-1"
              color="#003366"
              icon="mdi:mdi-download"
            ></v-icon>
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
        <h1 :lang="lang">
          {{ $t('trans.formViewerMultiUpload.jsonFileUpload') }}
        </h1>
        <p :lang="lang">{{ $t('trans.formViewerMultiUpload.dragNDrop') }}</p>

        <v-file-input
          ref="fileRef"
          class="drop-zone__input"
          accept="application/json"
          name="file"
          :label="$t('trans.formViewerMultiUpload.chooseAFile')"
          show-size
          :lang="lang"
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
              <label class="label-right">
                {{ fileSize }}
                <p v-if="index > 0 && Json.length > 0">
                  {{ index + '/' + Json.length }}
                </p>
              </label>
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
              <v-icon
                v-if="!response.error"
                color="green"
                icon="mdi:mdi-check"
              />
              {{ response.message }}
            </p>
          </v-col>
          <v-col cols="12" md="12">
            <p
              v-if="response.error && response.response.length > 0"
              style="text-align: justify; line-height: 1.2"
              :lang="lang"
            >
              {{ $t('trans.formViewerMultiUpload.downloadDraftSubmns') }}
              <br />
              <span class="link">
                <a
                  :hreflang="lang"
                  @click="
                    download(
                      response.file_name,
                      response.response,
                      $t('trans.formViewerMultiUpload.doYouWantToDownload')
                    )
                  "
                >
                  {{ $t('trans.formViewerMultiUpload.downloadReport') }}</a
                >
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
              file &&
              !progress &&
              response.error &&
              response.response.length > 0
            "
            cols="12"
            md="12"
          >
            <span class="m-1 pull-right">
              <v-btn color="primary" @click="resetUpload">
                <span :lang="lang">{{
                  $t('trans.formViewerMultiUpload.uploadNewFile')
                }}</span>
              </v-btn>
            </span>
          </v-col>
        </v-row>
        <v-row id="validateForm" class="displayNone"></v-row>
      </div>
    </v-container>
  </div>
</template>

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
