<script setup>
import { Form } from '@formio/vue';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUpdate, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import FormViewerActions from '~/components/designer/FormViewerActions.vue';
import templateExtensions from '~/plugins/templateExtensions';
import getRouter from '~/router';
import { formService, rbacService } from '~/services';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';

import { isFormPublic } from '~/utils/permissionUtils';
import { attachAttributesToLinks } from '~/utils/transformUtils';
import { FormPermissions, NotificationTypes } from '~/utils/constants';

const { locale, t } = useI18n({ useScope: 'global' });

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

const emits = defineEmits(['submission-updated']);

const allowSubmitterToUploadFile = ref(false);
const block = ref(false);
const bulkFile = ref(false);
const chefForm = ref(false);
const confirmSubmit = ref(false);
const currentForm = ref({});
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
const saveDraftState = ref(false);
const saving = ref(false);
const sbdMessage = ref({
  message: String,
  error: Boolean,
  upload_state: Number,
  response: [],
  file_name: String,
});
const showSubmitConfirmDialog = ref(false);
const submission = ref({ data: { lateEntry: false } });
const submissionRecord = ref({});
const version = ref(0);
const versionIdToSubmitTo = ref(properties.versionId);

const appStore = useAppStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const router = getRouter();

const { config } = storeToRefs(appStore);
const { authenticated } = storeToRefs(authStore);

const formScheduleExpireMessage = computed(() =>
  t('trans.formViewer.formScheduleExpireMessage')
);
const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);
const viewerOptions = computed(() => {
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
      },
    },
    evalContext: {
      token: authStore.tokenParsed,
      user: authStore.user,
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

function getCurrentAuthHeader() {
  return `Bearer ${authStore.token}`;
}

async function getFormData() {
  function iterate(obj, stack, fields, propNeeded) {
    //Get property path from nested object
    for (let property in obj) {
      if (typeof obj[property] == 'object') {
        return iterate(
          obj[property],
          stack + '.' + property,
          fields,
          propNeeded
        );
      } else if (propNeeded === property) {
        fields = fields + stack + '.' + property;
        return fields;
      }
    }
  }

  function deleteFieldData(fieldcomponent, sub) {
    if (Object.prototype.hasOwnProperty.call(fieldcomponent, 'components')) {
      fieldcomponent.components.map((subComponent) => {
        // Check if it's a Nested component
        deleteFieldData(subComponent, sub);
      });
    } else if (!fieldcomponent?.validate?.isUseForCopy) {
      _.unset(sub, iterate(sub, '', '', fieldcomponent.key).replace(/^\./, ''));
    }
  }

  try {
    loadingSubmission.value = true;
    const response = await formService.getSubmission(properties.submissionId);
    submissionRecord.value = Object.assign({}, response.data.submission);
    submission.value = submissionRecord.value.submission;
    form.value = response.data.form;
    if (!properties.isDuplicate) {
      //As we know this is a Submission from existing one so we will wait for the latest version to be set on the getFormSchema
      formSchema.value = response.data.version.schema;
      version.value = response.data.version.version;
    } else {
      /** Let's remove all the values of such components that are not enabled for Copy existing submission feature */
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
      consoleError: t('trans.formViewer.getUsersSubmissionsConsoleErrMsg'),
    });
  } finally {
    loadingSubmission.value = false;
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
        formScheduleExpireMessage.value = formScheduleStatus.message;
      }
    }
    listenFormChangeEvent(response);
  } catch (error) {
    if (authenticated.value) {
      isFormScheduleExpired.value = true;
      isLateSubmissionAllowed.value = false;
      formScheduleExpireMessage.value = error.message;
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

async function listenFormChangeEvent(response) {
  allowSubmitterToUploadFile.value = response.data.allowSubmitterToUploadFile;
  if (allowSubmitterToUploadFile.value && !properties.draftId) jsonManager();
}

function toggleBlock(e) {
  block.value = e;
}

function formChange(e) {
  if (e.changed != undefined && !e.changed.flags.fromSubmission) {
    formDataEntered.value = true;
  }
}

function jsonManager() {
  formElement.value = chefForm.value.formio;
  json_csv.value.data = [formElement.value.data, formElement.value.data];
  json_csv.value.file_name = 'template_' + form.value.name + '_' + Date.now();
}

function resetMessage() {
  sbdMessage.value.message = undefined;
  sbdMessage.value.error = false;
  sbdMessage.value.upload_state = 0;
  sbdMessage.value.response = [];
  sbdMessage.value.file_name = undefined;
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
      leaveThisPage();
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
      t('trans.formViewer.errSubmittingForm');
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
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response =
        error.response.data.reports == undefined
          ? [
              {
                error_message: t('trans.formViewer.errSubmittingForm'),
              },
            ]
          : await formatResponse(error.response.data.reports);
      sbdMessage.value.file_name =
        'error_report_' + form.value.name + '_' + Date.now();
    } else {
      sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
      sbdMessage.value.error = true;
      sbdMessage.value.upload_state = 10;
      sbdMessage.value.response = [
        { error_message: t('trans.formViewer.errSubmittingForm') },
      ];
      sbdMessage.value.file_name =
        'error_report_' + form.value.name + '_' + Date.now();
    }
  } catch (error_2) {
    sbdMessage.value.message = t('trans.formViewer.errSubmittingForm');
    sbdMessage.value.error = true;
    sbdMessage.value.upload_state = 10;
    sbdMessage.value.response = [
      { error_message: t('trans.formViewer.errSubmittingForm') },
    ];
    sbdMessage.value.file_name =
      'error_report_' + form.value.name + '_' + Date.now();
  }
}

async function formatResponse(response) {
  let newResponse = [];
  await response.forEach((item, index) => {
    if (item != null && item != undefined) {
      item.details.forEach((obj) => {
        let error = {};
        if (obj.context != undefined) {
          error = Object({
            ' submission': index,
            ' key': obj.context.key,
            ' label': obj.context.label,
            ' validator': obj.context.validator,
            error_message: obj.message,
          });
        } else {
          error = Object({
            ' submission': index,
            ' key': null,
            ' label': null,
            ' validator': null,
            error_message: obj.message,
          });
        }
        newResponse.push(error);
      });
    }
  });
  return newResponse;
}

function setError(data) {
  sbdMessage.value = data;
}

async function saveDraft() {
  try {
    saving.value = true;
    const response = await sendSubmission(true, submission.value);
    if (properties.submissionId) {
      // Editing an existing draft
      // Update this route with saved flag
      if (!properties.saved) {
        router.replace({
          name: 'UserFormDraftEdit',
          query: { ...router.currentRoute.value.query, sv: true },
        });
      }
      saving.value = false;
    } else {
      // Creating a new submission in draft state
      // Go to the user form draft page
      router.push({
        name: 'UserFormDraftEdit',
        query: {
          s: response.data.id,
          sv: true,
        },
      });
    }
    showSubmitConfirmDialog.value = false;
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
    // while 'confirm submit?' dialog is open..
    while (showSubmitConfirmDialog.value) {
      // await a promise that never resolves to block this thread
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (confirmSubmit.value) {
      confirmSubmit.value = false; // clear for next attempt
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
    return;
  }

  const errors = await doSubmit(sub);

  // if we are here, the submission has been saved to our db
  // the passed in submission is the formio submission, not our db persisted submission record...
  // fire off the submitDone event.
  // console.info(`onSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
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
  // console.info(`doSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
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
    emits('submission-updated');
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
  if (bulkFile.value) {
    showdoYouWantToSaveTheDraftModalForSwitch();
    return;
  }
  bulkFile.value = !bulkFile.value;
}

function showdoYouWantToSaveTheDraftModalForSwitch() {
  saveDraftState.value = 1;
  if (formDataEntered.value) {
    doYouWantToSaveTheDraft.value = true;
  } else {
    leaveThisPage();
  }
}

function showdoYouWantToSaveTheDraftModal() {
  if (!bulkFile.value) {
    saveDraftState.value = 0;
    if (properties.submissionId == undefined || formDataEntered.value)
      doYouWantToSaveTheDraft.value = true;
    else leaveThisPage();
  } else {
    leaveThisPage();
  }
}

function goTo(path, params) {
  router.push({
    name: path,
    query: params,
  });
}

function leaveThisPage() {
  if (saveDraftState.value == 0 || bulkFile.value) {
    goTo('UserSubmissions', { f: form.value.id });
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

onBeforeUpdate(() => {
  if (forceNewTabLinks.value) {
    attachAttributesToLinks(formSchema.value.components);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeWindowUnload);
});

if (properties.submissionId && properties.isDuplicate) {
  //Run when make new submission from existing one called.
  Promise.all([
    getFormData(),
    getFormSchema(), //We need this to be called as well, because we need latest version of form
  ]);
} else if (properties.submissionId && !properties.isDuplicate) {
  getFormData();
} else {
  getFormSchema();
}

// If they're filling in a form (ie, not loading existing data into the readonly one), enable the typical "leave site" native browser warning
if (!properties.preview && !properties.readOnly) {
  window.addEventListener('beforeunload', beforeWindowUnload);
}
</script>

<template>
  <v-skeleton-loader :loading="loadingSubmission" type="article, actions">
    <v-container fluid>
      <div v-if="isFormScheduleExpired">
        <v-alert
          :text="
            isLateSubmissionAllowed
              ? $t('trans.formViewer.lateFormSubmissions')
              : formScheduleExpireMessage
          "
          prominent
          type="error"
        >
        </v-alert>

        <div v-if="isLateSubmissionAllowed">
          <v-col cols="3" md="2">
            <v-btn color="primary" @click="isFormScheduleExpired = false">
              <span>{{ $t('trans.formViewer.createLateSubmission') }}</span>
            </v-btn>
          </v-col>
        </div>
      </div>

      <div v-else>
        <div v-if="displayTitle">
          <div v-if="!isFormPublic(form)">
            <FormViewerActions
              :allow-submitter-to-upload-file="allowSubmitterToUploadFile"
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
              @showdoYouWantToSaveTheDraftModal="
                showdoYouWantToSaveTheDraftModal
              "
              @save-draft="saveDraft"
              @switchView="switchView"
            />
          </div>
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
            <div v-if="saving">
              <v-progress-linear indeterminate />
              {{ $t('trans.formViewer.saving') }}
            </div>
            <div v-else>{{ $t('trans.formViewer.draftSaved') }}</div>
          </v-alert>

          <slot name="alert" :form="form" />

          <BaseDialog
            v-model="showSubmitConfirmDialog"
            type="CONTINUE"
            :enable-custom-button="canSaveDraft"
            @close-dialog="showSubmitConfirmDialog = false"
            @continue-dialog="continueSubmit"
          >
            <template #title>{{
              $t('trans.formViewer.pleaseConfirm')
            }}</template>
            <template #text>{{
              $t('trans.formViewer.submitFormWarningMsg')
            }}</template>
            <template #button-text-continue>
              <span>{{ $t('trans.formViewer.submit') }}</span>
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
              {{ $t('trans.formViewer.formLoading') }}
            </div>
          </v-alert>
          <FormViewerMultiUpload
            v-if="!isLoading && allowSubmitterToUploadFile && bulkFile"
            :response="sbdMessage"
            :form-element="formElement"
            :form="form"
            :form-schema="formSchema"
            :json_csv="json_csv"
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
            :form="formSchema"
            :submission="submission"
            :options="viewerOptions"
            :language="$i18n.locale"
            @submit="onSubmit"
            @submitDone="onSubmitDone"
            @submitButton="onSubmitButton"
            @customEvent="onCustomEvent"
            @change="formChange"
            @render="onFormRender"
          />
          <p v-if="version" class="text-right">
            {{ $t('trans.formViewer.version', { version: version }) }}
          </p>
        </div>
      </div>
      <BaseDialog
        v-model="doYouWantToSaveTheDraft"
        type="SAVEDDELETE"
        :enable-custom-button="false"
        @close-dialog="closeBulkYesOrNo"
        @delete-dialog="no"
        @continue-dialog="yes"
      >
        <template #title>{{ $t('trans.formViewer.pleaseConfirm') }}</template>
        <template #text>{{ $t('trans.formViewer.wantToSaveDraft') }}</template>
        <template #button-text-continue>
          <span>{{ $t('trans.formViewer.yes') }}</span>
        </template>
        <template #button-text-delete>
          <span>{{ $t('trans.formViewer.no') }}</span>
        </template>
      </BaseDialog>
    </v-container>
  </v-skeleton-loader>
</template>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.builder.min.css';

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
