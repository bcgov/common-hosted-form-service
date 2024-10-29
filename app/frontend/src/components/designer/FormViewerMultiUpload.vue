<script setup>
import { Formio, Utils } from '@formio/vue';
import _ from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { delay } from '~/composables/form';
import { formService } from '~/services';
import { useAppStore } from '~/store/app';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';
import { multiuploadTemplateFilename } from '~/utils/transformUtils';

const { locale, t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  // The form data
  form: {
    type: Object,
    default: () => {},
  },
  // The form schema
  formSchema: {
    type: Object,
    default: () => {},
  },
  // The version id to submit to
  submissionVersion: {
    type: String,
    default: null,
  },
  // This is the provided template
  jsonCsv: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['isProcessingMultiUpload']);

const appStore = useAppStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { isRTL } = storeToRefs(formStore);

// This timeout is purely used for adding an artificial delay, some systems were having
// an issue where they were running out of memory. The garbage collection for memory
// was not happening early/fast enough. This seems to be a good middleground.
const delayTime = ref(500);
// These are the errors that occur while validating the submissions or the file
const errors = ref([]);
// The file to be uploaded
const file = ref(undefined);
// The file input reference
const fileRef = ref(null);
// If there is a file currently being processed
const isProcessing = ref(false);
// This is the data that is read using the FileReader, this is usually multiple submissions in an array
const fileReaderData = ref(null);
const progressBar = ref({
  modelValue: 0,
  max: 100,
  message: '',
});
const sbdMessage = ref({
  message: undefined,
  error: false,
  upload_state: 0,
  response: [],
  file_name: undefined,
  typeError: -1,
});
// This is the index in the list of submissions that are being uploaded
const submissionIndex = ref(0);
// This is purely for validating the submission
const submissionToValidate = ref(null);

const fileSize = computed(() => {
  if (file.value.size < 1024) return file.value.size.toFixed(2) + ' bytes';
  if (file.value.size < 1024 * 1024)
    return (file.value.size / 1024).toFixed(2) + ' KB';
  return (file.value.size / (1024 * 1024)).toFixed(2) + ' MB';
});

const txt_colour = computed(() => {
  if (!sbdMessage.value.error) return 'success-text';
  else return 'fail-text';
});

function download(filename, data) {
  if (window.confirm(t('trans.formViewerMultiUpload.confirmDownload'))) {
    const blob = new Blob([JSON.stringify(data)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

function addFile(e, type) {
  if (isProcessing.value) return;

  if (file.value != undefined) {
    notificationStore.addNotification({
      text: t('trans.formViewerMultiUpload.uploadMultipleFileErr'),
      consoleError: t('trans.formViewerMultiUpload.uploadMultipleFileErr'),
    });
    return;
  }
  try {
    let files = type == 0 ? e.dataTransfer.files : e.target.files;

    if (!files || files == undefined) return;

    if (files.length > 1) {
      notificationStore.addNotification({
        text: t('trans.formViewerMultiUpload.dragMultipleFileErr'),
        consoleError: t('trans.formViewerMultiUpload.dragMultipleFileErr'),
      });
      return;
    }

    if (files[0]['type'] != 'application/json') {
      notificationStore.addNotification({
        text: t('trans.formViewerMultiUpload.fileFormatErr'),
        consoleError: t('trans.formViewerMultiUpload.fileFormatErr'),
      });
      return;
    }
    if (files[0].size > appStore.config.uploads.fileMaxSizeBytes) {
      notificationStore.addNotification({
        text: t('trans.formViewerMultiUpload.fileSizeErr'),
        consoleError: t('trans.formViewerMultiUpload.fileSizeErr'),
      });
      return;
    }
    file.value = files[0];
    parseFile();
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formViewerMultiUpload.errorWhileValidate'),
      consoleError:
        t('trans.formViewerMultiUpload.errorWhileValidate') + `${error}`,
    });
    return;
  }
}

function handleFile() {
  if (file.value == undefined) {
    fileRef.value.click();
  }
}

function parseFile() {
  try {
    let reader = new FileReader();
    reader.onload = (e) => {
      // The file MUST be JSON. If it fails to parse then it will throw an error.
      fileReaderData.value = popFormLevelInfo(JSON.parse(e.target.result));
    };
    reader.onloadend = preValidateSubmission;
    reader.readAsText(file.value);
  } catch (e) {
    resetUploadState();
    notificationStore.addNotification({
      text: t('trans.formViewerMultiUpload.parseJsonErr'),
      consoleError: e,
    });
  }
}

function popFormLevelInfo(jsonPayload = []) {
  /** This function is purely made to remove unnecessary information
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
}

async function preValidateSubmission() {
  try {
    if (!Array.isArray(fileReaderData.value)) {
      resetUploadState();
      notificationStore.addNotification({
        text: t('trans.formViewerMultiUpload.jsonObjNotArray'),
        consoleError: t('trans.formViewerMultiUpload.jsonObjNotArrayConsErr'),
      });
      return;
    }
    if (fileReaderData.value.length == 0) {
      resetUploadState();
      notificationStore.addNotification({
        text: t('trans.formViewerMultiUpload.jsonArrayEmpty'),
        consoleError: t('trans.formViewerMultiUpload.fileIsEmpty'),
      });
      return;
    }
    errors.value = [];
    submissionIndex.value = 0;
    isProcessing.value = true;
    emit('isProcessingMultiUpload', true);
    const formHtml = document.getElementById('validateForm');
    //Add custom validation to the Components those are not covered by FormIO Validation class
    await Utils.eachComponent(
      properties.formSchema.components,
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
    submissionToValidate.value = await Formio.createForm(
      formHtml,
      properties.formSchema,
      {
        highlightErrors: true,
        alwaysDirty: true,
        hide: {
          submit: true,
        },
      }
    );
    // In the next tick, we begin validating the submission
    nextTick(() => {
      validate(fileReaderData.value[submissionIndex.value], []);
    });
  } catch (error) {
    resetUploadState();
    notificationStore.addNotification({
      text: t('trans.formViewerMultiUpload.errorWhileValidate'),
      consoleError: error,
    });
    return;
  }
}

async function getMemoryInfo() {
  return new Promise((resolve) => {
    // window.performance.memory is DEPRECATED, this needs to be replaced
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
}

async function checkMemoryUsage() {
  let time = 1000;
  const memoryUsage = await getMemoryInfo();
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
}

function convertEmptyArraysToNull(obj) {
  /*
   * This function is purely made to solve this https://github.com/formio/formio.js/issues/4515 formio bug
   * where setSubmission mislead payload for submission. In our case if setSubmission got triggered multiple
   * time it cache submission key's with old values that leads to trigger false validation errors.
   * This function clear object with some empty arrays to null. Main problem was occured to columns and grids components.
   */

  if (_.isArray(obj)) {
    return obj.length === 0 ? null : obj.map(convertEmptyArraysToNull);
  } else if (_.isObject(obj)) {
    return _.mapValues(obj, convertEmptyArraysToNull);
  } else {
    return obj;
  }
}

async function validate(element, errors) {
  await delay(delayTime.value);
  //this.checkMemoryUsage();
  const response = await formIOValidation(element);
  if (response.error) {
    errors[submissionIndex.value] = {
      submission: submissionIndex.value,
      errors: response.data,
    };
  }
  delete response.error;
  delete response.data;
  submissionToValidate.value.setSubmission({
    data: undefined,
  });
  validationDispatcher(errors);
}

async function validationDispatcher(errors) {
  /* we need this timer allow to the gargabe colector to have time
    to clean the memory before starting  a new form validation */

  submissionToValidate.value.clearServerErrors();
  submissionToValidate.value.resetValue();
  submissionToValidate.value.clear();
  const response = await checkMemoryUsage();
  await delay(response);
  const check = {
    shouldContinueValidation:
      Number(submissionIndex.value) < Number(fileReaderData.value.length - 1), //Need to compare with JSON length - 1 because we only need to perform validation upto the last instance/object of Json array.
  };
  if (check.shouldContinueValidation) {
    nextTick(() => {
      submissionIndex.value++;
      progressBar.value.percent = percentage(submissionIndex.value);
    });
    delete check.shouldContinueValidation;
    nextTick(() => {
      validate(fileReaderData.value[submissionIndex.value], errors);
    });
  } else {
    nextTick(() => {
      submissionIndex.value++;
      progressBar.value.percent = percentage(submissionIndex.value);
    });
    endValidation(errors);
  }
}

async function formIOValidation(element) {
  return new Promise((resolve) => {
    submissionToValidate.value.setSubmission({
      data: convertEmptyArraysToNull(element),
    });
    submissionToValidate.value
      .submit()
      .then((submission) => {
        resolve({ error: false, data: submission });
      })
      .catch((error) => {
        resolve({ error: true, data: error });
      });
  });
}

function percentage(i) {
  let number_of_submission = fileReaderData.value.length;
  if (number_of_submission > 0 && i > 0) {
    return Math.ceil((i * progressBar.value.max) / number_of_submission);
  }
  return 0;
}

async function endValidation(errs) {
  errors.value = errs;
  isProcessing.value = false;
  submissionToValidate.value.destroy();
  submissionToValidate.value = null;
  if (errors.value.length == 0) {
    await saveBulkData(fileReaderData.value);
  } else {
    emit('isProcessingMultiUpload', false);
    setError({
      text: t('trans.formViewerMultiUpload.errAfterValidate'),
      error: true,
      upload_state: 10,
      response: {
        data: {
          title: 'Validation Error',
          reports: errors.value,
        },
      },
      typeError: 0,
    });
  }
}

function resetUploadState() {
  errors.value = [];
  isProcessing.value = false;
  file.value = undefined;
  submissionIndex.value = 0;
  progressBar.value = {
    percent: 0,
    message: '',
  };
  sbdMessage.value = {
    message: undefined,
    error: false,
    upload_state: 0,
    response: [],
    file_name: undefined,
    typeError: -1,
  };
}

async function saveBulkData(submissions) {
  const payload = {
    draft: true,
    submission: Object.freeze({ data: submissions }),
  };
  await sendMultiSubmissionData(payload);
}

async function sendMultiSubmissionData(body) {
  try {
    isProcessing.value = true;
    let response = await formService.createMultiSubmission(
      properties.form.id,
      properties.submissionVersion,
      body
    );
    if ([200, 201].includes(response.status)) {
      // all is good, flag no errors and carry on...
      // store our submission result...
      sbdMessage.value.message = t('trans.formViewer.multiDraftUploadSuccess');
      sbdMessage.value.error = false;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response = [];
      notificationStore.addNotification({
        text: sbdMessage.value.message,
        ...NotificationTypes.SUCCESS,
      });
    } else {
      sbdMessage.value.message = t('trans.formViewer.failedResSubmissn', {
        status: response.status,
      });
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response = [
        { error_message: t('trans.formViewer.errSubmittingForm') },
      ];
      sbdMessage.value.file_name =
        'error_report_' + properties.form.name + '_' + Date.now();
      throw new Error(
        t('trans.formViewer.failedResSubmissn', {
          status: response.status,
        })
      );
    }
  } catch (error) {
    setFinalError(error);
    notificationStore.addNotification({
      text: sbdMessage.value.message,
      consoleError: t('trans.formViewer.errorSavingFile', {
        fileName: file.value.name,
        error: error,
      }),
    });
  } finally {
    isProcessing.value = false;
  }
}

function setFinalError(error) {
  try {
    if (error.response.data != undefined && error.response.data !== '') {
      sbdMessage.value.message =
        error.response.data.title == undefined
          ? t('trans.formViewer.errSubmittingForm')
          : error.response.data.title;
      sbdMessage.value.response =
        error.response.data.reports == undefined
          ? [
              {
                error_message: t('trans.formViewer.errSubmittingForm'),
              },
            ]
          : formatResponse(error.response.data.reports);
    } else {
      sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
      sbdMessage.value.response = [
        { error_message: t('trans.formViewer.errSubmittingForm') },
      ];
    }
  } catch (err) {
    sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
    sbdMessage.value.response = [
      { error_message: t('trans.formViewer.errSubmittingForm') },
    ];
  } finally {
    sbdMessage.value.error = true;
    sbdMessage.value.upload_state = 10;
    sbdMessage.value.file_name =
      'error_report_' + properties.form.name + '_' + Date.now();
  }
}

function buildValidationFromComponent(obj) {
  if (obj?.component?.validate) {
    let validatorIdentity = '';
    Object.keys(obj.component.validate).forEach((validity) => {
      switch (validity) {
        case 'maxSelectedCount':
          if (obj.component.validate.maxSelectedCount) {
            validatorIdentity +=
              '|maxSelectedCount:' + obj.component.validate[validity];
          }
          break;

        case 'minSelectedCount':
          if (obj.component.validate.minSelectedCount) {
            validatorIdentity +=
              '|minSelectedCount:' + obj.component.validate[validity];
          }
          break;

        case 'multiple':
          if (obj.component.validate.multiple) {
            validatorIdentity +=
              '|multiple:' + obj.component.validate[validity];
          }
          break;

        case 'onlyAvailableItems':
          if (obj.component.validate.onlyAvailableItems) {
            validatorIdentity +=
              '|onlyAvailableItems:' + obj.component.validate[validity];
          }
          break;

        case 'required':
          if (obj.component.validate.required) {
            validatorIdentity +=
              '|required:' + obj.component.validate[validity];
          }
          break;

        case 'strictDateValidation':
          if (obj.component.validate.strictDateValidation) {
            validatorIdentity +=
              '|strictDateValidation:' + obj.component.validate[validity];
          }
          break;

        case 'unique':
          if (obj.component.validate.unique) {
            validatorIdentity += '|unique:' + obj.component.validate[validity];
          }
          break;

        case 'custom':
          if (obj.component.validate.custom.length) {
            validatorIdentity +=
              '|custom:' +
              obj.component.validate[validity].trim().replaceAll(',', '‚');
          }
          break;

        case 'customMessage':
          if (obj.component.validate.customMessage) {
            validatorIdentity +=
              '|customMessage:' +
              obj.component.validate[validity].trim().replaceAll(',', '‚');
          }
          break;

        case 'customPrivate':
          if (obj.component.validate.customPrivate) {
            validatorIdentity +=
              '|customPrivate:' + obj.component.validate[validity].trim();
          }
          break;

        case 'json':
          if (obj.component.validate.json) {
            validatorIdentity += '|json:' + obj.component.validate[validity];
          }
          break;

        case 'pattern':
          if (obj.component.validate.pattern) {
            validatorIdentity += '|pattern:' + obj.component.validate[validity];
          }
          break;

        case 'maxWords':
          if (obj.component.validate.maxWords) {
            validatorIdentity +=
              '|maxWords:' + obj.component.validate[validity];
          }
          break;

        case 'minWords':
          if (obj.component.validate.minWords) {
            validatorIdentity +=
              '|minWords:' + obj.component.validate[validity];
          }
          break;

        case 'maxLength':
          if (obj.component.validate.maxLength) {
            validatorIdentity +=
              '|maxLength:' + obj.component.validate[validity];
          }
          break;

        case 'minLength':
          if (obj.component.validate.minLength) {
            validatorIdentity +=
              '|minLength:' + obj.component.validate[validity];
          }
          break;

        default:
          validatorIdentity +=
            '|' + validity + ':' + obj.component.validate[validity];
          break;
      }
    });
    return validatorIdentity.replace(/^\|/, '');
  } else if (
    obj?.messages?.length > 0 &&
    obj?.messages[0]?.context?.validator
  ) {
    return obj.messages[0].context.validator;
  } else {
    return 'Unknown';
  }
}

function frontendFormatResponse(response) {
  let newResponse = [];

  for (const item of response) {
    if (item != null && item != undefined) {
      for (const obj of item.errors) {
        let error = {};

        if (obj.component != undefined) {
          error = {
            submission: item.submission,
            key: obj.component.key,
            label: obj.component.label,
            validator: buildValidationFromComponent(obj),
            error_message: obj.message,
          };
        } else {
          error = {
            submission: item.submission,
            key: null,
            label: null,
            validator: null,
            error_message: obj.message,
          };
        }

        newResponse.push(error);
      }
    }
  }

  return newResponse;
}

function formatResponse(response) {
  let newResponse = [];
  response.forEach((item, index) => {
    if (item != null && item != undefined) {
      item.details.forEach((obj) => {
        let error = {};
        if (obj.context != undefined) {
          error = Object({
            submission: index,
            key: obj.context.key,
            label: obj.context.label,
            validator: obj.context.validator,
            error_message: obj.message,
          });
        } else {
          error = Object({
            submission: index,
            key: null,
            label: null,
            validator: null,
            error_message: obj.message,
          });
        }
        newResponse.push(error);
      });
    }
  });
  return newResponse;
}

function setError(error) {
  sbdMessage.value = error;

  try {
    if (error.response.data != undefined) {
      sbdMessage.value.message =
        error.response.data.title === undefined
          ? t('trans.formViewer.errSubmittingForm')
          : error.response.data.title;
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response =
        error.response.data.reports == undefined
          ? [{ error_message: t('trans.formViewer.errSubmittingForm') }]
          : frontendFormatResponse(error.response.data.reports);
      sbdMessage.value.file_name =
        'error_report_' + properties.form.name + '_' + Date.now();
    } else {
      sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response = [
        { error_message: t('trans.formViewer.errSubmittingForm') },
      ];
      sbdMessage.value.file_name =
        'error_report_' + properties.form.name + '_' + Date.now();
    }
  } catch (err) {
    sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
    sbdMessage.value.error = true;
    sbdMessage.value.upload_state = 10;
    sbdMessage.value.response = [
      { error_message: t('trans.formViewer.errSubmittingForm') },
    ];
    sbdMessage.value.file_name =
      'error_report_' + properties.form.name + '_' + Date.now();
  }
}
</script>

<template>
  <div class="file-upload" :class="{ 'dir-rtl': isRTL }">
    <v-container fluid class="file-upload">
      <BaseInfoCard v-if="jsonCsv.data" class="mb-4">
        <h4 class="text-primary" :lang="locale">
          <v-icon
            :class="isRTL ? 'ml-1' : 'mr-1'"
            color="primary"
            icon="mdi:mdi-information"
          ></v-icon
          >{{ $t('trans.formViewerMultiUpload.important') }}!
        </h4>
        <p class="my-2" :lang="locale">
          {{ $t('trans.formViewerMultiUpload.uploadSucessMsg') }}
          <span class="link">
            <a
              :lang="locale"
              @click="
                download(
                  multiuploadTemplateFilename(form.name),
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
        <h1 :lang="locale">
          {{ $t('trans.formViewerMultiUpload.jsonFileUpload') }}
        </h1>
        <p :lang="locale">{{ $t('trans.formViewerMultiUpload.dragNDrop') }}</p>

        <v-file-input
          ref="fileRef"
          class="drop-zone__input"
          accept="application/json"
          name="file"
          :label="$t('trans.formViewerMultiUpload.chooseAFile')"
          show-size
          :lang="locale"
          @change="addFile($event, 1)"
        >
        </v-file-input>
      </div>
      <div v-else class="worker-zone">
        <div class="wz-top">
          <v-progress-linear
            v-model="progressBar.percent"
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
                <p v-if="submissionIndex > 0 && fileReaderData.length > 0">
                  {{ submissionIndex + '/' + fileReaderData.length }}
                </p>
              </label>
            </v-col>
          </v-row>
          <v-row class="p-1">
            <v-col
              v-if="!isProcessing && sbdMessage.upload_state == 10"
              cols="12"
              md="12"
              class="message-block"
            >
              <hr v-if="sbdMessage.error" />
              <span>Report: </span>
              <p :class="txt_colour">
                <v-icon
                  v-if="sbdMessage.error"
                  color="red"
                  icon="mdi:mdi-close"
                />
                <v-icon
                  v-if="!sbdMessage.error"
                  color="green"
                  icon="mdi:mdi-check"
                />
                {{ sbdMessage.message }}
              </p>
            </v-col>
            <v-col cols="12" md="12">
              <p
                v-if="sbdMessage.error && sbdMessage.response.length > 0"
                style="text-align: justify; line-height: 1.2"
                :lang="locale"
              >
                {{ $t('trans.formViewerMultiUpload.downloadDraftSubmns') }}
                <br />
                <span class="link">
                  <a
                    :lang="locale"
                    @click="
                      download(
                        sbdMessage.file_name,
                        sbdMessage.response,
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
                !isProcessing &&
                sbdMessage.error &&
                sbdMessage.response.length > 0
              "
              cols="12"
              md="12"
            >
              <span class="m-1 pull-right">
                <v-btn
                  color="primary"
                  :title="$t('trans.formViewerMultiUpload.uploadNewFile')"
                  @click="resetUploadState"
                >
                  <span :lang="locale">{{
                    $t('trans.formViewerMultiUpload.uploadNewFile')
                  }}</span>
                </v-btn>
              </span>
            </v-col>
          </v-row>
          <v-row id="validateForm" class="displayNone"></v-row>
        </div>
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
