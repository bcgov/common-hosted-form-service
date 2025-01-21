<script setup>
import { Form } from '@formio/vue';
import _ from 'lodash';
import { storeToRefs } from 'pinia';
import {
  computed,
  onBeforeUpdate,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import BaseDialog from '~/components/base/BaseDialog.vue';
import FormViewerActions from '~/components/designer/FormViewerActions.vue';
import FormViewerMultiUpload from '~/components/designer/FormViewerMultiUpload.vue';
import templateExtensions from '~/plugins/templateExtensions';
import { fileService, formService, rbacService } from '~/services';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

import { isFormPublic } from '~/utils/permissionUtils';
import {
  attachAttributesToLinks,
  getDisposition,
} from '~/utils/transformUtils';
import { FormPermissions, NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const router = useRouter();

const emit = defineEmits(['submission-updated']);

const properties = defineProps({
  displayTitle: {
    type: Boolean,
    default: false,
  },
  draftId: {
    type: String,
    default: null,
  },
  formId: {
    type: String,
    default: null,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  preview: Boolean,
  staffEditMode: {
    type: Boolean,
    default: false,
  },
  saved: {
    type: Boolean,
    default: false,
  },
  submissionId: {
    type: String,
    default: null,
  },
  versionId: {
    type: String,
    default: null,
  },
  isDuplicate: {
    type: Boolean,
    default: false,
  },
});

const block = ref(false);
const bulkFile = ref(false);
const chefForm = ref(null);
const confirmSubmit = ref(false);
const currentForm = ref({});
const downloadTimeout = ref(null);
const doYouWantToSaveTheDraft = ref(false);
const forceNewTabLinks = ref(true);
const form = ref({});
const formDataEntered = ref(false);
const formElement = ref(undefined);
const formFields = ref([]);
const formSchema = ref({});
const isFormScheduleExpired = ref(false);
const isLateSubmissionAllowed = ref(false);
const isLoading = ref(false);
const json_csv = ref({
  data: [],
  file_name: String,
});
const loadingSubmission = ref(false);
const permissions = ref([]);
const reRenderFormIo = ref(0);
const saveDraftDialog = ref(false);
const saveDraftState = ref(0);
const saving = ref(false);
const sbdMessage = ref({
  message: String,
  error: Boolean,
  upload_state: Number,
  response: [],
  file_name: String,
  typeError: Number,
});
const showModal = ref(false);
const showSubmitConfirmDialog = ref(false);
const submission = ref({ data: { lateEntry: false } });
const submissionRecord = ref({});
const version = ref(0);
const versionIdToSubmitTo = ref(properties.versionId);
const isAuthorized = ref(true);

const appStore = useAppStore();
const authStore = useAuthStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { config } = storeToRefs(appStore);
const { authenticated, keycloak, tokenParsed, user } = storeToRefs(authStore);
const { downloadedFile, isRTL } = storeToRefs(formStore);

const formScheduleExpireMessage = computed(() =>
  form?.value?.schedule?.message
    ? form.value.schedule.message
    : t('trans.formViewer.formScheduleExpireMessage')
);

const formUnauthorizedMessage = computed(() =>
  t('trans.formViewer.formUnauthorizedMessage')
);

const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);

const viewerOptions = computed(() => {
  // Force recomputation of viewerOptions after rerendered formio to prevent duplicate submission update calls
  reRenderFormIo.value;

  return {
    sanitizeConfig: {
      addTags: ['iframe'],
      ALLOWED_TAGS: ['iframe'],
    },
    templates: templateExtensions,
    readOnly: properties.readOnly,
    hooks: {
      beforeSubmit: onBeforeSubmit,
    },
    // pass in options for custom components to use
    componentOptions: {
      simplefile: {
        config: config.value,
        chefsToken: getCurrentAuthHeader,
        deleteFile: deleteFile,
        getFile: getFile,
        uploadFile: uploadFile,
      },
    },
    evalContext: {
      token: tokenParsed.value,
      user: user.value,
    },
  };
});

const canSaveDraft = computed(
  () =>
    !properties.readOnly &&
    permissions.value.includes(FormPermissions.SUBMISSION_UPDATE)
);

watch(locale, () => {
  reRenderFormIo.value += 1;
});

onMounted(async () => {
  // load up headers for any External API calls
  // from components.
  await setProxyHeaders();
  if (properties.submissionId && properties.isDuplicate) {
    // Run when make new submission from existing one called. Get the
    // published version of form, and then get the submission data.
    await getFormSchema();
    await getFormData();
  } else if (properties.submissionId && !properties.isDuplicate) {
    await getFormData();
  } else {
    showModal.value = true;
    await getFormSchema();
  }
  window.addEventListener('beforeunload', beforeWindowUnload);

  reRenderFormIo.value += 1;
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeWindowUnload);
  clearTimeout(downloadTimeout.value);
});

onBeforeUpdate(() => {
  if (forceNewTabLinks.value) {
    attachAttributesToLinks(formSchema.value.components);
  }
});

function getCurrentAuthHeader() {
  return `Bearer ${keycloak.value.token}`;
}

async function getFormData() {
  function iterate(obj, stack, fields, propNeeded) {
    //Get property path from nested object
    for (let property in obj) {
      const innerObject = obj[property];

      if (propNeeded === property) {
        fields = fields + stack + '.' + property;
        return fields.replace(/^\./, '');
      } else if (Array.isArray(innerObject)) {
        // When the form contains a Data Grid there will be an array that
        // needs to be checked, and an array of properties to be unset.
        const fieldsArray = [];
        for (let i = 0; i < innerObject.length; i++) {
          const next = iterate(
            innerObject[i],
            stack + '.' + property + '[' + i + ']',
            fields,
            propNeeded
          );

          if (next) {
            fieldsArray.push(next);
          }
        }

        if (fieldsArray.length > 0) {
          return fieldsArray;
        }
      } else if (typeof innerObject === 'object') {
        return iterate(innerObject, stack + '.' + property, fields, propNeeded);
      }
    }
  }

  function deleteFieldData(fieldcomponent, submission) {
    if (Object.prototype.hasOwnProperty.call(fieldcomponent, 'columns')) {
      // It's a layout component that has columns.
      fieldcomponent.columns.map((subComponent) => {
        deleteFieldData(subComponent, submission);
      });
    } else if (
      Object.prototype.hasOwnProperty.call(fieldcomponent, 'components')
    ) {
      // It's a layout component that has subcomponents, such as a panel.
      fieldcomponent.components.map((subComponent) => {
        deleteFieldData(subComponent, submission);
      });
    } else if (fieldcomponent?.validate?.isUseForCopy === false) {
      const fieldPath = iterate(submission, '', '', fieldcomponent.key);
      if (Array.isArray(fieldPath)) {
        for (let path of fieldPath) {
          _.unset(submission, path);
        }
      } else if (fieldPath) {
        _.unset(submission, fieldPath);
      }
    }
  }

  try {
    loadingSubmission.value = true;
    const response = await formService.getSubmission(properties.submissionId);
    submissionRecord.value = Object.assign({}, response.data.submission);
    submission.value = submissionRecord.value.submission;
    showModal.value =
      submission.value.data.submit ||
      submission.value.data.state == 'submitted' ||
      !submissionRecord.value.draft ||
      properties.readOnly
        ? false
        : true;
    form.value = response.data.form;
    versionIdToSubmitTo.value = versionIdToSubmitTo.value
      ? versionIdToSubmitTo.value
      : response.data?.version?.id;
    if (!properties.isDuplicate) {
      //As we know this is a Submission from existing one so we will wait for the latest version to be set on the getFormSchema
      formSchema.value = response.data.version.schema;
      version.value = response.data.version.version;
    } else {
      if (
        response.data?.version?.schema?.components &&
        response.data?.version?.schema?.components.length
      ) {
        response.data.version.schema.components.map((component) => {
          deleteFieldData(component, submission.value); //Delete all the fields data that are not enabled for duplication
        });
      }
    }
    // Get permissions
    if (!properties.staffEditMode && !isFormPublic(form.value)) {
      const permRes = await rbacService.getUserSubmissions({
        formSubmissionId: properties.submissionId,
      });
      permissions.value = permRes.data[0] ? permRes.data[0].permissions : [];
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formViewer.getUsersSubmissionsErrMsg'),
      consoleError: t('trans.formViewer.getUsersSubmissionsConsoleErrMsg', {
        submissionId: properties.submissionId,
        error: error,
      }),
    });
  } finally {
    loadingSubmission.value = false;
  }
}

async function setProxyHeaders() {
  try {
    let response = await formService.getProxyHeaders({
      formId: properties.formId,
      versionId: properties.versionId,
      submissionId: properties.submissionId,
    });
    // error checking for response
    sessionStorage.setItem(
      'X-CHEFS-PROXY-DATA',
      response.data['X-CHEFS-PROXY-DATA']
    );
  } catch (error) {
    // need error handling
  }
}

// Get the form definition/schema
async function getFormSchema() {
  try {
    let response = undefined;
    if (properties.versionId) {
      versionIdToSubmitTo.value = properties.versionId;
      // If getting for a specific older version of the form
      response = await formService.readVersion(
        properties.formId,
        properties.versionId
      );
      if (!response.data || !response.data.schema) {
        throw new Error(
          t('trans.formViewer.readVersionErrMsg', {
            versionId: properties.versionId,
          })
        );
      }
      form.value = response.data;
      version.value = response.data.version;
      formSchema.value = response.data.schema;
    } else if (properties.draftId) {
      // If getting for a specific draft version of the form for preview
      response = await formService.readDraft(
        properties.formId,
        properties.draftId
      );
      if (!response.data || !response.data.schema) {
        throw new Error(
          t('trans.formViewer.readDraftErrMsg', {
            draftId: properties.draftId,
          })
        );
      }
      form.value = response.data;
      formSchema.value = response.data.schema;
    } else {
      // If getting the HEAD form version (IE making a new submission)
      response = await formService.readPublished(properties.formId);
      if (
        !response ||
        !response.data ||
        !response.data.versions ||
        !response.data.versions[0]
      ) {
        router.push({
          name: 'Alert',
          query: {
            text: t('trans.formViewer.alertRouteMsg'),
            type: 'info',
          },
        });
        return;
      }
      form.value = response.data;
      version.value = response.data.versions[0].version;
      versionIdToSubmitTo.value = response.data.versions[0].id;
      formSchema.value = response.data.versions[0].schema;

      if (response.data.schedule && response.data.schedule.expire) {
        let formScheduleStatus = response.data.schedule;
        isFormScheduleExpired.value = formScheduleStatus.expire;
        isLateSubmissionAllowed.value = formScheduleStatus.allowLateSubmissions;
      }
    }
  } catch (error) {
    if (authenticated.value) {
      // if 401 error, the user is not authorized to view the form
      if (error.response && error.response.status === 401) {
        isAuthorized.value = false;
      } else {
        // throw a generic error message
        notificationStore.addNotification({
          text: t('trans.formViewer.fecthingFormErrMsg'),
          consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
            versionId: properties.versionId,
            error: error,
          }),
        });
      }
    }
  }
}

function toggleBlock(e) {
  block.value = e;
}

function formChange(e) {
  // if draft check validation on render
  if (submissionRecord.value.draft) {
    chefForm.value.formio.checkValidity(null, true, null, false);
  }
  if (e.changed != undefined && !e.changed.flags.fromSubmission) {
    formDataEntered.value = true;
  }

  // Seems to be the only place the form changes on load
  jsonManager();
}

function jsonManager() {
  json_csv.value.file_name = 'template_' + form.value.name + '_' + Date.now();
  if (chefForm.value?.formio) {
    formElement.value = chefForm.value.formio;
    json_csv.value.data = [
      JSON.parse(JSON.stringify(formElement.value._data)),
      JSON.parse(JSON.stringify(formElement.value._data)),
    ];
  }
}

function resetMessage() {
  sbdMessage.value.message = undefined;
  sbdMessage.value.error = false;
  sbdMessage.value.upload_state = 0;
  sbdMessage.value.response = [];
  sbdMessage.value.file_name = undefined;
  sbdMessage.value.typeError = -1;
  block.value = false;
}

async function saveBulkData(submissions) {
  const payload = {
    draft: true,
    submission: Object.freeze({ data: submissions }),
  };
  block.value = true;
  sendMultiSubmissionData(payload);
}

async function sendMultiSubmissionData(body) {
  try {
    saving.value = true;
    let response = await formService.createMultiSubmission(
      properties.formId,
      versionIdToSubmitTo.value,
      body
    );
    if ([200, 201].includes(response.status)) {
      // all is good, flag no errors and carry on...
      // store our submission result...
      sbdMessage.value.message = t('trans.formViewer.multiDraftUploadSuccess');
      sbdMessage.value.error = false;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response = [];
      block.value = false;
      saving.value = false;
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
      block.value = false;
      sbdMessage.value.response = [
        { error_message: t('trans.formViewer.errSubmittingForm') },
      ];
      sbdMessage.value.file_name =
        'error_report_' + form.value.name + '_' + Date.now();
      saving.value = false;
      throw new Error(
        t('trans.formViewer.failedResSubmissn', {
          status: response.status,
        })
      );
    }
  } catch (error) {
    saving.value = false;
    block.value = false;
    setFinalError(error);
    notificationStore.addNotification({
      text: sbdMessage.value.message,
      consoleError: t('trans.formViewer.errorSavingFile', {
        fileName: json_csv.value.file_name,
        error: error,
      }),
    });
  }
}

async function setFinalError(error) {
  try {
    if (error.response.data != undefined) {
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
          : await formatResponse(error.response.data.reports);
    } else {
      sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
      sbdMessage.value.response = [
        { error_message: t('trans.formViewer.errSubmittingForm') },
      ];
    }
  } catch (error_2) {
    sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
    sbdMessage.value.response = [
      { error_message: t('trans.formViewer.errSubmittingForm') },
    ];
  } finally {
    sbdMessage.value.error = true;
    sbdMessage.value.upload_state = 10;
    sbdMessage.value.file_name =
      'error_report_' + form.value.name + '_' + Date.now();
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
  } else if (obj?.messages[0]?.context?.validator) {
    return obj.messages[0].context.validator;
  } else {
    return 'Unknown';
  }
}

async function frontendFormatResponse(response) {
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

async function formatResponse(response) {
  let newResponse = [];
  await response.forEach((item, index) => {
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

async function setError(error) {
  sbdMessage.value = error;

  try {
    if (error.response.data != undefined) {
      sbdMessage.value.message =
        error.response.data.title == undefined
          ? 'An error occurred submitting this form'
          : error.response.data.title;
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response =
        error.response.data.reports == undefined
          ? [{ error_message: 'An error occurred submitting this form' }]
          : await frontendFormatResponse(error.response.data.reports);
      sbdMessage.value.file_name =
        'error_report_' + form.value.name + '_' + Date.now();
    } else {
      sbdMessage.value.message = 'An error occurred submitting this form';
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response = [
        { error_message: 'An error occurred submitting this form' },
      ];
      sbdMessage.value.file_name =
        'error_report_' + form.value.name + '_' + Date.now();
    }
  } catch (error_2) {
    sbdMessage.value.message = 'An error occurred submitting this form';
    sbdMessage.value.error = true;
    sbdMessage.value.upload_state = 10;
    sbdMessage.value.response = [
      { error_message: 'An error occurred submitting this form' },
    ];
    sbdMessage.value.file_name =
      'error_report_' + form.value.name + '_' + Date.now();
  }
}

async function saveDraft() {
  try {
    saving.value = true;

    const response = await sendSubmission(true, submission.value);
    if (properties.submissionId && properties.submissionId !== null) {
      // Editing an existing draft
      // Update this route with saved flag
      if (!properties.saved) {
        await router.replace({
          name: 'UserFormDraftEdit',
          query: { ...router.currentRoute.value.query, sv: true },
        });
      }
      saving.value = false;
    } else {
      // Creating a new submission in draft state
      // Go to the user form draft page
      await router.push({
        name: 'UserFormDraftEdit',
        query: {
          s: response.data.id,
          sv: true,
        },
      });
    }
    showSubmitConfirmDialog.value = false;
    saveDraftDialog.value = false;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formViewer.savingDraftErrMsg'),
      consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
        submissionId: properties.submissionId,
        error: error,
      }),
    });
  }
}

async function sendSubmission(isDraft, sub) {
  sub.data.lateEntry =
    form.value?.schedule?.expire !== undefined &&
    form.value.schedule.expire === true
      ? form.value.schedule.allowLateSubmissions
      : false;
  const body = {
    draft: isDraft,
    submission: sub,
  };

  let response;
  //let's check if this is a submission from existing one, If isDuplicate then create new submission if now isDuplicate then update the submission
  if (properties.submissionId && !properties.isDuplicate) {
    // Updating an existing submission
    response = await formService.updateSubmission(
      properties.submissionId,
      body
    );
  } else {
    // Adding a new submission
    response = await formService.createSubmission(
      properties.formId,
      versionIdToSubmitTo.value,
      body
    );
  }

  return response;
}

function onFormRender() {
  if (isLoading.value) isLoading.value = false;
}

// -----------------------------------------------------------------------------------------
// FormIO Events
// -----------------------------------------------------------------------------------------
// https://help.form.io/developers/form-renderer#form-events
// event order is:
// onSubmitButton
// onBeforeSubmit
// if no errors: onSubmit -> onSubmitDone
// else onSubmitError
function onSubmitButton(event) {
  if (properties.preview) {
    alert(t('trans.formViewer.submissionsPreviewAlert'));
    return;
  }
  // this is our first event in the submission chain.
  // most important thing here is ensuring that the formio form does not have an action, or else it POSTs to that action.
  // console.info('onSubmitButton()') ; // eslint-disable-line no-console
  currentForm.value = event.instance.parent.root;
  currentForm.value.form.action = undefined;

  // if form has drafts enabled in form settings, show 'confirm submit?' dialog
  if (form.value.enableSubmitterDraft) {
    showSubmitConfirmDialog.value = true;
  }
}

// If the confirm modal pops up on drafts
function continueSubmit() {
  confirmSubmit.value = true;
  showSubmitConfirmDialog.value = false;
}

// formIO hook, prior to a submission occurring
// We can cancel a formIO submission event here, or go on
async function onBeforeSubmit(submission, next) {
  // dont do anything if previewing the form
  if (properties.preview) {
    // Force re-render form.io to reset submit button state
    reRenderFormIo.value += 1;
    return;
  }

  // if form has drafts enabled in form setttings,
  if (form.value.enableSubmitterDraft) {
    let timeout;
    // while 'confirm submit?' dialog is open..
    while (showSubmitConfirmDialog.value) {
      // await a promise that never resolves to block this thread
      await new Promise((resolve) => (timeout = setTimeout(resolve, 500)));
    }
    if (confirmSubmit.value) {
      confirmSubmit.value = false; // clear for next attempt
      clearTimeout(timeout);
      next();
    } else {
      // Force re-render form.io to reset submit button state
      reRenderFormIo.value += 1;
    }
  } else {
    next();
  }
}

// FormIO submit event
// eslint-disable-next-line no-unused-vars
async function onSubmit(sub) {
  if (properties.preview) {
    alert(t('trans.formViewer.submissionsPreviewAlert'));
    confirmSubmit.value = false;
    return;
  }

  const errors = await doSubmit(sub);

  // if we are here, the submission has been saved to our db
  // the passed in submission is the formio submission, not our db persisted submission record...
  // fire off the submitDone event.
  if (errors) {
    notificationStore.addNotification({
      text: errors,
      consoleError: t('trans.formViewer.submissionsSubmitErrMsg', {
        errors: errors,
      }),
    });
  } else {
    currentForm.value.events.emit('formio.submitDone');
  }
}

// Not a formIO event, our saving routine to POST the submission to our API
async function doSubmit(sub) {
  // since we are not using formio api
  // we should do the actual submit here, and return any error that occurrs to handle in the submit event
  let errMsg = undefined;
  try {
    const response = await sendSubmission(false, sub);

    if ([200, 201].includes(response.status)) {
      // all is good, flag no errors and carry on...
      // store our submission result...
      submissionRecord.value = Object.assign(
        {},
        properties.submissionId && properties.isDuplicate //Check if this submission is creating with the existing one
          ? response.data
          : properties.submissionId && !properties.isDuplicate
          ? response.data.submission
          : response.data
      );
    } else {
      throw new Error(
        t('trans.formViewer.sendSubmissionErrMsg', {
          status: response.status,
        })
      );
    }
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    errMsg = t('trans.formViewer.errMsg');
  } finally {
    confirmSubmit.value = false;
  }
  return errMsg;
}

async function onSubmitDone() {
  // huzzah!
  // really nothing to do, the formio button has consumed the event and updated its display
  // is there anything here for us to do?
  // console.info('onSubmitDone()') ; // eslint-disable-line no-console
  if (properties.staffEditMode) {
    // updating an existing submission on the staff side
    emit('submission-updated');
  } else {
    // User created new submission
    router.push({
      name: 'FormSuccess',
      query: {
        s: submissionRecord.value.id,
      },
    });
  }
}

// Custom Event triggered from buttons with Action type "Event"
function onCustomEvent(event) {
  alert(t('trans.formViewer.customEventAlert', { event: event.type }));
}

function switchView() {
  if (!bulkFile.value) {
    showdoYouWantToSaveTheDraftModalForSwitch();
    return;
  }
  bulkFile.value = !bulkFile.value;
}

function showdoYouWantToSaveTheDraftModalForSwitch() {
  saveDraftState.value = 1;
  if (formDataEntered.value && showModal.value) {
    doYouWantToSaveTheDraft.value = true;
  } else {
    leaveThisPage();
  }
}

function showdoYouWantToSaveTheDraftModal() {
  if (!bulkFile.value) {
    saveDraftState.value = 0;
    if (
      (properties.submissionId == undefined || formDataEntered.value) &&
      showModal.value &&
      form.value.enableSubmitterDraft
    ) {
      doYouWantToSaveTheDraft.value = true;
    } else leaveThisPage();
  } else {
    leaveThisPage();
  }
}

function leaveThisPage() {
  if (saveDraftState.value == 0 || bulkFile.value) {
    router.push({
      name: 'UserSubmissions',
      query: { f: form.value.id },
    });
  } else {
    bulkFile.value = !bulkFile.value;
  }
}

function yes() {
  saveDraftFromModal(true);
}

function no() {
  saveDraftFromModal(false);
}

function saveDraftFromModal(event) {
  doYouWantToSaveTheDraft.value = false;
  if (event) {
    saveDraftFromModalNow();
  } else {
    leaveThisPage();
  }
}

// Custom Event triggered from buttons with Action type "Event"
async function saveDraftFromModalNow() {
  try {
    saving.value = true;
    await sendSubmission(true, submission.value);
    saving.value = false;
    // Creating a new submission in draft state
    // Go to the user form draft page
    leaveThisPage();
    showSubmitConfirmDialog.value = false;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formViewer.submittingDraftErrMsg'),
      consoleError: t('trans.formViewer.submittingDraftConsErrMsg', {
        submissionId: properties.submissionId,
        error: error,
      }),
    });
  }
}

function closeBulkYesOrNo() {
  doYouWantToSaveTheDraft.value = false;
}

function beforeWindowUnload(e) {
  if (!properties.preview && !properties.readOnly) {
    e.preventDefault();
    e.returnValue = '';
  }
}

async function deleteFile(file) {
  const fileId = file?.data?.id ? file.data.id : file?.id ? file.id : undefined;
  return fileService.deleteFile(fileId);
}

async function getFile(fileId, options = {}) {
  await formStore.downloadFile(fileId, options);
  if (downloadedFile.value && downloadedFile.value.headers) {
    let data;

    if (
      downloadedFile.value.headers['content-type'].includes('application/json')
    ) {
      data = JSON.stringify(downloadedFile.value.data);
    } else {
      data = downloadedFile.value.data;
    }

    if (typeof data === 'string') {
      data = new Blob([data], {
        type: downloadedFile.value.headers['content-type'],
      });
    }

    // don't need to blob because it's already a blob
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = getDisposition(
      downloadedFile.value.headers['content-disposition']
    );
    a.style.display = 'none';
    a.classList.add('hiddenDownloadTextElement');
    document.body.appendChild(a);
    a.click();
    downloadTimeout.value = setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  }
}

async function uploadFile(file, config = {}) {
  return fileService.uploadFile(file, config);
}
</script>

<template>
  <v-skeleton-loader :loading="loadingSubmission" type="article, actions">
    <v-container fluid>
      <div v-if="!isAuthorized">
        <v-alert
          :text="formUnauthorizedMessage"
          prominent
          type="error"
          :class="{ 'dir-rtl': isRTL }"
          :lang="locale"
        >
        </v-alert>
      </div>

      <div v-else-if="isFormScheduleExpired">
        <v-alert
          :text="
            isLateSubmissionAllowed
              ? $t('trans.formViewer.lateFormSubmissions')
              : formScheduleExpireMessage
          "
          prominent
          type="error"
          :class="{ 'dir-rtl': isRTL }"
          :lang="locale"
        >
        </v-alert>

        <div v-if="isLateSubmissionAllowed">
          <v-col cols="12" md="6">
            <v-btn
              color="primary"
              :class="{ 'dir-rtl': isRTL }"
              :title="$t('trans.formViewer.createLateSubmission')"
              @click="isFormScheduleExpired = false"
            >
              <span :lang="locale">{{
                $t('trans.formViewer.createLateSubmission')
              }}</span>
            </v-btn>
          </v-col>
        </div>
      </div>

      <div v-else>
        <div v-if="displayTitle">
          <FormViewerActions
            :allow-submitter-to-upload-file="form.allowSubmitterToUploadFile"
            :block="block"
            :bulk-file="bulkFile"
            :copy-existing-submission="form.enableCopyExistingSubmission"
            :draft-enabled="form.enableSubmitterDraft"
            :form-id="form.id"
            :is-draft="submissionRecord.draft"
            :permissions="permissions"
            :read-only="readOnly"
            :submission="submission"
            :submission-id="submissionId"
            :wide-form-layout="form.wideFormLayout"
            :public-form="isFormPublic(form)"
            class="d-print-none"
            @showdoYouWantToSaveTheDraftModal="showdoYouWantToSaveTheDraftModal"
            @save-draft="saveDraft"
            @switchView="switchView"
          />
          <h1 class="my-6 text-center">{{ form.name }}</h1>
        </div>
        <div class="form-wrapper">
          <v-alert
            v-if="saved || saving"
            :class="
              saving
                ? NOTIFICATIONS_TYPES.INFO.class
                : NOTIFICATIONS_TYPES.SUCCESS.class
            "
            :icon="
              saving
                ? NOTIFICATIONS_TYPES.INFO.icon
                : NOTIFICATIONS_TYPES.SUCCESS.icon
            "
          >
            <div v-if="saving" :class="{ 'mr-2': isRTL }">
              <v-progress-linear indeterminate :lang="locale" />
              {{ $t('trans.formViewer.saving') }}
            </div>
            <div v-else :class="{ 'mr-2': isRTL }" :lang="locale">
              {{ $t('trans.formViewer.draftSaved') }}
            </div>
          </v-alert>

          <slot name="alert" :form="form" :class="{ 'dir-rtl': isRTL }" />

          <BaseDialog
            v-model="showSubmitConfirmDialog"
            type="CONTINUE"
            :enable-custom-button="canSaveDraft"
            @close-dialog="showSubmitConfirmDialog = false"
            @continue-dialog="continueSubmit"
          >
            <template #title>
              <span :lang="locale">{{
                $t('trans.formViewer.pleaseConfirm')
              }}</span></template
            >
            <template #text
              ><span :lang="locale">{{
                $t('trans.formViewer.submitFormWarningMsg')
              }}</span></template
            >
            <template #button-text-continue>
              <span :lang="locale">{{ $t('trans.formViewer.submit') }}</span>
            </template>
          </BaseDialog>

          <v-alert
            v-if="isLoading && !bulkFile && submissionId == undefined"
            class="mt-2 mb-2"
            :value="isLoading"
            :class="NOTIFICATIONS_TYPES.INFO.class"
            :color="NOTIFICATIONS_TYPES.INFO.color"
            :icon="NOTIFICATIONS_TYPES.INFO.icon"
          >
            <div color="info" icon="$info">
              <v-progress-linear
                :indeterminate="true"
                color="blue-grey-lighten-4"
                height="5"
              ></v-progress-linear>
              <span :class="{ 'mr-2': isRTL }" :lang="locale">
                {{ $t('trans.formViewer.formLoading') }}
              </span>
            </div>
          </v-alert>
          <FormViewerMultiUpload
            v-if="!isLoading && form.allowSubmitterToUploadFile && bulkFile"
            :response="sbdMessage"
            :form="form"
            :form-element="formElement"
            :form-schema="formSchema"
            :json-csv="json_csv"
            :form-fields="formFields"
            @save-bulk-data="saveBulkData"
            @reset-message="resetMessage"
            @set-error="setError"
            @toggleBlock="toggleBlock"
          />

          <Form
            v-if="!bulkFile"
            :key="reRenderFormIo"
            ref="chefForm"
            :class="{ 'v-locale--is-ltr': isRTL }"
            :form="formSchema"
            :submission="submission"
            :options="viewerOptions"
            :language="locale"
            @submit="onSubmit"
            @submitDone="onSubmitDone"
            @submitButton="onSubmitButton"
            @customEvent="onCustomEvent"
            @change="formChange"
            @render="onFormRender"
          />
          <p
            v-if="version"
            :class="{ 'text-left': isRTL }"
            class="mt-3"
            :lang="locale"
          >
            {{ $t('trans.formViewer.version', { version: version }) }}
          </p>
        </div>
      </div>
      <BaseDialog
        v-model="doYouWantToSaveTheDraft"
        :class="{ 'dir-rtl': isRTL }"
        type="SAVEDDELETE"
        :enable-custom-button="false"
        @close-dialog="closeBulkYesOrNo"
        @delete-dialog="no"
        @continue-dialog="yes"
      >
        <template #title
          ><span :lang="locale">
            {{ $t('trans.formViewer.pleaseConfirm') }}</span
          ></template
        >
        <template #text
          ><span :lang="locale">
            {{ $t('trans.formViewer.wantToSaveDraft') }}</span
          ></template
        >
        <template #button-text-continue>
          <span :lang="locale"> {{ $t('trans.formViewer.yes') }}</span>
        </template>
        <template #button-text-delete>
          <span :lang="locale"> {{ $t('trans.formViewer.no') }}</span>
        </template>
      </BaseDialog>
    </v-container>
  </v-skeleton-loader>
</template>

<style lang="scss" scoped>
.form-wrapper :deep(.formio-form) {
  &.formio-read-only {
    // in submission review mode, make readonly formio fields consistently greyed-out
    .form-control,
    .formio-component-simpletextarea .card-body.bg-light,
    .choices.is-disabled .choices__input {
      background-color: #e9ecef !important;
    }
    .formio-component-simpletextarea .card-body.bg-light {
      border: 1px solid #606060;
    }
  }
}
</style>
