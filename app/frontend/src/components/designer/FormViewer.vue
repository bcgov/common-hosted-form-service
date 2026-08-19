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
import { useRoute, useRouter } from 'vue-router';

import BaseDialog from '~/components/base/BaseDialog.vue';
import FormViewerActions from '~/components/designer/FormViewerActions.vue';
import FormViewerMultiUpload from '~/components/designer/FormViewerMultiUpload.vue';
import { v4 as uuidv4 } from 'uuid';
import {
  offlineQueue,
  QueueStatus,
  QUEUE_SOFT_CAP,
  idbAvailable,
} from '~/offline/queue';
import { tryDrain } from '~/offline/offlineQueueManager';
import { useOnlineStatus } from '~/offline/useOnlineStatus';
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

const route = useRoute();
const router = useRouter();

const IDB_UNAVAILABLE_NOTICE_KEY =
  'trans.offlineSubmission.idbUnavailableNotice';

const emit = defineEmits(['submission-updated', 'access-denied']);

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
const showModal = ref(false);
const showSubmitConfirmDialog = ref(false);
const showSaveDraftConfirmDialog = ref(false);
// Optional label shown in the Pending Submissions list; cleared per dialog open.
const queueNote = ref('');
// True when the queue-confirm dialog is opened for a draft save (not a submit).
const queueConfirmIsDraft = ref(false);
// When editing a queued offline submission, the entry being edited (else null).
const editingEntry = ref(null);
const isEditingOfflineEntry = computed(() => !!editingEntry.value);
const submission = ref({ data: { lateEntry: false } });
const submissionRecord = ref({});
const version = ref(0);
const versionIdToSubmitTo = ref(properties.versionId);
const isAuthorized = ref(true);

const appStore = useAppStore();
const authStore = useAuthStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { online } = useOnlineStatus();

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

const shouldDisableFileDownloads = computed(() => {
  // To disable file downloads for Public forms
  if (!form.value || !properties.readOnly) {
    return false;
  }

  return (
    properties.readOnly && isFormPublic(form.value) && !authenticated.value
  );
});

const viewerOptions = computed(() => {
  // Force recomputation of viewerOptions after rerendered formio to prevent duplicate submission update calls
  reRenderFormIo.value;

  const evalContextUser = getEvalContextUser();

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
      user: evalContextUser,
    },
  };
});

function getEvalContextUser() {
  // New submission (no submissionId), use current logged in user
  if (!properties.submissionId) {
    return user.value;
  }

  // Reviewer viewing in read-only mode, use submitter
  if (properties.readOnly && submissionRecord.value?.createdBy) {
    return {
      id: submissionRecord.value.createdBy,
      username: submissionRecord.value.createdBy,
      fullName:
        submissionRecord.value.createdByUsername ||
        submissionRecord.value.createdBy,
      email: submissionRecord.value.createdByEmail || '',
    };
  }

  // Submitter editing their own submission, use submitter
  if (
    !properties.staffEditMode &&
    submissionRecord.value?.createdBy &&
    submissionRecord.value.createdBy === user.value?.usernameIdp
  ) {
    return {
      id: submissionRecord.value.createdBy,
      username: submissionRecord.value.createdBy,
      fullName:
        submissionRecord.value.createdByUsername ||
        submissionRecord.value.createdBy,
      email: submissionRecord.value.createdByEmail || '',
    };
  }

  // Reviewer editing a submission, use current logged in user
  return user.value;
}

const canSaveDraft = computed(
  () =>
    !properties.readOnly &&
    permissions.value.includes(FormPermissions.SUBMISSION_UPDATE)
);

watch(locale, () => {
  reRenderFormIo.value += 1;
});

// Disable FormIO's submit button while editing an offline entry (banner Save
// takes over). Clone first: schema is cached by reference in the form store.
function disableSubmitButtons(components) {
  if (!Array.isArray(components)) return;
  for (const c of components) {
    if (c?.type === 'button' && c?.action === 'submit') c.disabled = true;
    if (Array.isArray(c?.components)) disableSubmitButtons(c.components);
    if (Array.isArray(c?.columns)) {
      for (const col of c.columns) disableSubmitButtons(col.components);
    }
  }
}
const renderedSchema = computed(() => {
  const schema = formSchema.value;
  if (!schema || !isEditingOfflineEntry.value) return schema;
  // Proxy chokes on structuredClone()
  const clone = JSON.parse(JSON.stringify(schema)); //NOSONAR
  disableSubmitButtons(clone.components);
  return clone;
});

onMounted(async () => {
  // load up headers for any External API calls
  // from components.
  await setProxyHeaders();
  const editOfflineId = route?.query?.editOffline;
  if (editOfflineId) {
    await loadOfflineEntryForEdit(editOfflineId);
  } else if (properties.submissionId && properties.isDuplicate) {
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
  await offlineQueue.ensureLoaded();
  if (form.value?.enableOfflineSubmission && !idbAvailable.value) {
    notificationStore.addNotification({
      text: t(IDB_UNAVAILABLE_NOTICE_KEY),
      ...NotificationTypes.WARNING,
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeWindowUnload);
  clearTimeout(downloadTimeout.value);
  if (editingEntry.value?.id) {
    offlineQueue.endEdit(editingEntry.value.id);
    tryDrain();
  }
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
  // When the form contains a Data Grid there will be an array that needs to be
  // checked, and an array of properties to be unset.
  function iterateArray(array, stack, fields, propNeeded) {
    const fieldsArray = [];
    for (let i = 0; i < array.length; i++) {
      const next = iterate(array[i], stack + '[' + i + ']', fields, propNeeded);
      if (next) {
        fieldsArray.push(...(Array.isArray(next) ? next : [next]));
      }
    }
    return fieldsArray;
  }

  function iterate(obj, stack, fields, propNeeded) {
    //Get property path from nested object
    for (let property in obj) {
      const innerObject = obj[property];
      const path = stack + '.' + property;

      if (propNeeded === property) {
        return (fields + path).replace(/^\./, '');
      } else if (Array.isArray(innerObject)) {
        const fieldsArray = iterateArray(innerObject, path, fields, propNeeded);
        if (fieldsArray.length > 0) {
          return fieldsArray;
        }
      } else if (typeof innerObject === 'object' && innerObject !== null) {
        return iterate(innerObject, path, fields, propNeeded);
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
    // Schedule status is already processed by backend (checkIsFormExpired)
    // Set flags directly from the form schedule data
    if (form.value.schedule && form.value.schedule.expire !== undefined) {
      isFormScheduleExpired.value = form.value.schedule.expire === true;
      isLateSubmissionAllowed.value =
        form.value.schedule.allowLateSubmissions === true;
    } else {
      // Explicitly reset flags if no schedule
      isFormScheduleExpired.value = false;
      isLateSubmissionAllowed.value = false;
    }
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
    handleGetFormDataError(error);
  } finally {
    loadingSubmission.value = false;
  }
}

// Sharing-off + 401 is the "forwarded success URL, viewer isn't on the form
// team" case. Success.vue listens on `access-denied` and falls back to the
// static confirmation block; suppressing the notification (and the follow-on
// calls) avoids a burst of misleading errors for what is really a known
// "you can't view this submission" state.
function handleGetFormDataError(error) {
  if (
    error.response?.status === 401 &&
    formStore.form.enableSubmissionUrlSharing === false
  ) {
    emit('access-denied');
    return;
  }
  notificationStore.addNotification({
    text: t('trans.formViewer.getUsersSubmissionsErrMsg'),
    consoleError: t('trans.formViewer.getUsersSubmissionsConsoleErrMsg', {
      submissionId: properties.submissionId,
      error: error,
    }),
  });
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
  // Offline: use in-memory cache (only works within a single SPA session).
  if (!online.value && properties.formId) {
    const cache = formStore.getCachedFormSchema(
      properties.formId,
      properties.versionId
    );
    if (cache) {
      form.value = cache.form;
      formSchema.value = cache.schema;
      versionIdToSubmitTo.value = properties.versionId || cache.versionId;
      return;
    }
  }
  try {
    if (properties.versionId) {
      await loadFormByVersion();
      return;
    }
    if (properties.draftId) {
      await loadFormByDraft();
      return;
    }
    await loadPublishedForm();
  } catch (error) {
    handleGetFormSchemaError(error);
  }
}

async function loadFormByVersion() {
  versionIdToSubmitTo.value = properties.versionId;
  const response = await formService.readVersion(
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
}

async function loadFormByDraft() {
  const response = await formService.readDraft(
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
}

async function loadPublishedForm() {
  const response = await formService.readPublished(properties.formId);
  if (!response?.data?.versions?.[0]) {
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
  // Cache for offline "Start another submission" re-mount.
  formStore.cacheFormSchema(
    properties.formId,
    versionIdToSubmitTo.value,
    form.value,
    formSchema.value
  );
  if (response.data.schedule?.expire) {
    isFormScheduleExpired.value = response.data.schedule.expire;
    isLateSubmissionAllowed.value = response.data.schedule.allowLateSubmissions;
  }
}

function handleGetFormSchemaError(error) {
  // Silent for anonymous viewers (public forms rendered without auth).
  if (!authenticated.value) return;
  if (error.response?.status === 401) {
    isAuthorized.value = false;
    return;
  }
  notificationStore.addNotification({
    text: t('trans.formViewer.fecthingFormErrMsg'),
    consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
      versionId: properties.versionId,
      error: error,
    }),
  });
}

function isProcessingMultiUpload(e) {
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
      JSON.parse(JSON.stringify(formElement.value._data)), // NOSONAR
      // FormIO _data contains non-cloneable references
      JSON.parse(JSON.stringify(formElement.value._data)), // NOSONAR
      // FormIO _data contains non-cloneable references
    ];
  }
}

async function queueDraftOffline(sub, dedupKey) {
  try {
    await queueSubmissionOffline(sub, true, dedupKey);
    await router.push({
      name: 'FormSubmit',
      query: {
        f: properties.formId,
        fresh: Date.now(),
      },
    });
    return undefined;
  } catch (queueError) {
    if (queueError.code === 'IDB_UNAVAILABLE') {
      return t(IDB_UNAVAILABLE_NOTICE_KEY);
    }
    return queueError.code === 'QUEUE_CAP'
      ? t('trans.offlineSubmission.errorAtCap', { cap: QUEUE_SOFT_CAP })
      : extractErrorMessage(queueError);
  }
}

async function saveDraft() {
  // Save-as-Draft is inert while editing an offline entry: banner Save saves.
  if (isEditingOfflineEntry.value) return;
  const isNewSubmission = !properties.submissionId || properties.isDuplicate;
  if (form.value.enableOfflineSubmission && isNewSubmission && !online.value) {
    if (!idbAvailable.value) {
      notificationStore.addNotification({
        text: t(IDB_UNAVAILABLE_NOTICE_KEY),
        ...NotificationTypes.WARNING,
      });
      return;
    }
    queueNote.value = '';
    queueConfirmIsDraft.value = true;
    showSubmitConfirmDialog.value = true;

    let timeout;
    while (showSubmitConfirmDialog.value) {
      await new Promise((resolve) => (timeout = setTimeout(resolve, 500)));
    }
    clearTimeout(timeout);
    if (!confirmSubmit.value) return;
    confirmSubmit.value = false;
    const errMsg = await queueDraftOffline(submission.value);
    if (errMsg) {
      notificationStore.addNotification({
        text: errMsg,
        consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
          submissionId: properties.submissionId,
          error: errMsg,
        }),
      });
    }
    return;
  }
  showSaveDraftConfirmDialog.value = true;
}

async function routeAfterSaveDraftSuccess(response) {
  const isEditingExisting =
    properties.submissionId &&
    properties.submissionId !== null &&
    !properties.isDuplicate;
  if (isEditingExisting) {
    if (!properties.saved) {
      await router.replace({
        name: 'UserFormDraftEdit',
        query: { ...router.currentRoute.value.query, sv: true },
      });
    }
    saving.value = false;
    return;
  }
  await router.push({
    name: 'UserFormDraftEdit',
    query: { s: response.data.id, sv: true },
  });
}

async function handleSaveDraftError(error, isNewSubmission, dedupKey) {
  const canQueueOffline =
    form.value.enableOfflineSubmission &&
    isNewSubmission &&
    isNetworkError(error);
  if (canQueueOffline) {
    const errMsg = await queueDraftOffline(submission.value, dedupKey);
    if (!errMsg) return;
    notificationStore.addNotification({
      text: errMsg,
      consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
        submissionId: properties.submissionId,
        error: errMsg,
      }),
    });
    return;
  }
  notificationStore.addNotification({
    text: t('trans.formViewer.savingDraftErrMsg'),
    consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
      submissionId: properties.submissionId,
      error: error,
    }),
  });
}

async function confirmSaveDraft() {
  showSaveDraftConfirmDialog.value = false;
  const isNewSubmission = !properties.submissionId || properties.isDuplicate;
  const dedupKey = isNewSubmission ? uuidv4() : undefined;
  try {
    saving.value = true;
    const response = await sendSubmission(true, submission.value, dedupKey);
    await routeAfterSaveDraftSuccess(response);
    showSubmitConfirmDialog.value = false;
    saveDraftDialog.value = false;
  } catch (error) {
    await handleSaveDraftError(error, isNewSubmission, dedupKey);
  }
}

async function sendSubmission(isDraft, sub, dedupKey) {
  submission.value.data.lateEntry =
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
    // Adding a new submission. Send the dedupKey so a lost-response retry
    // (online or via the offline queue) replays instead of creating a duplicate.
    response = await formService.createSubmission(
      properties.formId,
      versionIdToSubmitTo.value,
      body,
      { dedupKey }
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

  // Inert while editing an offline entry (banner Save takes over).
  if (isEditingOfflineEntry.value) return;
  // if form has drafts enabled in form settings, show 'confirm submit?' dialog.
  // Also show offline so the user knows their submission will be queued.
  const idbBlocked =
    form.value.enableOfflineSubmission && !online.value && !idbAvailable.value;
  if (idbBlocked) {
    notificationStore.addNotification({
      text: t(IDB_UNAVAILABLE_NOTICE_KEY),
      ...NotificationTypes.WARNING,
    });
    // Leave showSubmitConfirmDialog/confirmSubmit false so onBeforeSubmit's
    // wait loop skips and it re-renders form.io to cancel the pending submit.
    return;
  }
  if (
    form.value.enableSubmitterDraft ||
    (form.value.enableOfflineSubmission && !online.value)
  ) {
    queueNote.value = '';
    queueConfirmIsDraft.value = false;
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

  // Inert while editing an offline entry (banner Save takes over).
  if (isEditingOfflineEntry.value) {
    reRenderFormIo.value += 1;
    return;
  }

  // if form has drafts enabled in form setttings, or we're queuing while offline
  if (
    form.value.enableSubmitterDraft ||
    (form.value.enableOfflineSubmission && !online.value)
  ) {
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
    // On error: reset button state without triggering navigation
    // Force re-render form.io to reset submit button state
    reRenderFormIo.value += 1;
  } else if (currentForm.value?.events) {
    // On success: emit submitDone to reset button AND trigger navigation via onSubmitDone handler
    currentForm.value.events.emit('formio.submitDone');
  }
}

// Helper function to extract submission data from response
function extractSubmissionData(response) {
  if (properties.submissionId && properties.isDuplicate) {
    return response.data;
  }
  if (properties.submissionId && !properties.isDuplicate) {
    return response.data.submission;
  }
  return response.data;
}

// Helper function to extract error message from error object
function extractErrorMessage(error) {
  if (error.response?.status === 403) {
    // Backend returns schedule expiration message
    return (
      error.response.data?.detail ||
      error.response.data?.message ||
      formScheduleExpireMessage.value
    );
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return t('trans.formViewer.errMsg');
}

function isNetworkError(error) {
  if (!error) return false;
  if (error.code === 'ERR_NETWORK') return true;
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    return true;
  return !error.response;
}

async function loadOfflineEntryForEdit(entryId) {
  await offlineQueue.ensureLoaded();
  const entry = offlineQueue.entries.value.find((e) => e.id === entryId);
  if (!entry || entry.status === QueueStatus.SYNCING) {
    notificationStore.addNotification({
      text: t('trans.offlineSubmission.editEntryUnavailable'),
    });
    await router.replace({
      name: 'FormSubmit',
      query: { f: properties.formId },
    });
    return;
  }
  if (entry.formId !== properties.formId) {
    // Wrong form for this FormViewer instance; silently reroute to the entry's
    // form so the Submit.vue :key remount picks it up with matching formId.
    await router.replace({
      name: 'FormSubmit',
      query: { f: entry.formId, editOffline: entryId },
    });
    return;
  }
  editingEntry.value = entry;
  offlineQueue.beginEdit(entry.id);
  const cached = formStore.getCachedFormSchema(entry.formId, entry.versionId);
  if (cached) {
    form.value = cached.form;
    formSchema.value = cached.schema;
    versionIdToSubmitTo.value = cached.versionId || entry.versionId;
  } else {
    try {
      const response = await formService.readVersion(
        entry.formId,
        entry.versionId
      );
      form.value = response.data;
      version.value = response.data.version;
      formSchema.value = response.data.schema;
      versionIdToSubmitTo.value = entry.versionId;
      formStore.cacheFormSchema(
        entry.formId,
        entry.versionId,
        form.value,
        formSchema.value
      );
    } catch (error) {
      // Schema couldn't load (e.g. offline with no cached schema). Abort the
      // edit cleanly instead of leaving the banner over an empty form, where
      // Save would overwrite the queued entry with no submission data.
      offlineQueue.endEdit(entry.id);
      editingEntry.value = null;
      notificationStore.addNotification({
        text: t('trans.offlineSubmission.editEntryUnavailable'),
        consoleError: error,
      });
      await router.replace({
        name: 'FormSubmit',
        query: { f: properties.formId },
      });
      return;
    }
  }
  // Deep-clone so Form.io keystrokes mutate our copy, not the queued entry
  // (a mid-edit drain would otherwise POST the unsaved edits).
  const cloned = entry.body?.submission
    ? JSON.parse(JSON.stringify(entry.body.submission)) //NOSONAR
    : { data: {} };
  submission.value = cloned;
  queueNote.value = entry.note ?? '';
}

// Update the queued entry in place; return undefined on success, error message on failure.
async function tryUpdateQueuedOffline(sub) {
  try {
    await updateQueuedOffline(sub);
    return undefined;
  } catch (updateError) {
    return extractErrorMessage(updateError);
  }
}

async function updateQueuedOffline(sub) {
  const entry = editingEntry.value;
  const updated = await offlineQueue.update(entry.id, {
    body: {
      draft: entry.body?.draft ?? false,
      submission: sub,
    },
    note: queueNote.value?.trim() || null,
  });
  if (!updated) {
    throw new Error(t('trans.offlineSubmission.editEntryUnavailable'));
  }
  notificationStore.addNotification({
    text: t(
      entry.body?.draft
        ? 'trans.offlineSubmission.editedDraftToastMessage'
        : 'trans.offlineSubmission.editedToastMessage'
    ),
    ...NotificationTypes.SUCCESS,
  });
  submissionRecord.value = { id: `pending-${entry.dedupKey}` };
  return updated;
}

async function saveOfflineEntry() {
  const errMsg = await tryUpdateQueuedOffline(submission.value);
  if (!errMsg) return;
  notificationStore.addNotification({
    text: errMsg,
    consoleError: t('trans.formViewer.fecthingFormConsoleErrMsg', {
      submissionId: properties.submissionId,
      error: errMsg,
    }),
  });
}

function cancelOfflineEdit() {
  router.replace({
    name: 'FormSubmit',
    query: {
      f: properties.formId,
    },
  });
}

// Queue offline; return undefined on success, an error message on failure.
async function tryQueueOffline(sub, dedupKey) {
  try {
    await queueSubmissionOffline(sub, false, dedupKey);
    return undefined;
  } catch (queueError) {
    if (queueError.code === 'IDB_UNAVAILABLE') {
      return t(IDB_UNAVAILABLE_NOTICE_KEY);
    }
    return queueError.code === 'QUEUE_CAP'
      ? t('trans.offlineSubmission.errorAtCap', { cap: QUEUE_SOFT_CAP })
      : extractErrorMessage(queueError);
  }
}

async function queueSubmissionOffline(sub, isDraft, dedupKey) {
  const entry = await offlineQueue.enqueue({
    formId: properties.formId,
    formName: form.value?.name,
    versionId: versionIdToSubmitTo.value,
    userId: user.value?.idpUserId,
    body: {
      draft: isDraft,
      submission: sub,
    },
    note: queueNote.value?.trim() || null,
    // Drafts never produce a backend confirmation id, so suppress the row.
    showConfirmationId: isDraft
      ? false
      : !!form.value?.showSubmissionConfirmation,
    // Reuse the online attempt's key when present so a lost-response retry
    // replays; enqueue mints a fresh one when this is undefined.
    dedupKey,
  });
  notificationStore.addNotification({
    text: t(
      isDraft
        ? 'trans.offlineSubmission.queuedDraftToastMessage'
        : 'trans.offlineSubmission.queuedToastMessage'
    ),
    ...NotificationTypes.SUCCESS,
  });
  // Let onSubmitDone do the single navigation; a router.push here races it.
  submissionRecord.value = { id: `pending-${entry.dedupKey}` };
  return entry;
}

// Not a formIO event, our saving routine to POST the submission to our API
async function doSubmit(sub) {
  // Unreachable while editing an offline entry (onBeforeSubmit blocks it);
  // guard here anyway so a code-path change doesn't silently trigger a POST.
  if (isEditingOfflineEntry.value) return;
  // since we are not using formio api
  // we should do the actual submit here, and return any error that occurrs to handle in the submit event
  let errMsg = undefined;
  const isNewSubmission = !properties.submissionId || properties.isDuplicate;
  // Mint the dedupKey before the online attempt and reuse it if we fall back to
  // the offline queue, so a lost-response retry replays instead of duplicating.
  const dedupKey = isNewSubmission ? uuidv4() : undefined;
  try {
    // Validate schedule before submission
    if (isFormScheduleExpired.value && !isLateSubmissionAllowed.value) {
      const errorMsg = formScheduleExpireMessage.value;
      notificationStore.addNotification({
        text: errorMsg,
        consoleError: `Submission blocked: ${errorMsg}`,
      });
      return errorMsg; // This will be caught and handled by onSubmit
    }
    if (
      form.value.enableOfflineSubmission &&
      isNewSubmission &&
      !online.value
    ) {
      return tryQueueOffline(sub, dedupKey);
    }
    const response = await sendSubmission(false, sub, dedupKey);

    if ([200, 201].includes(response.status)) {
      // all is good, flag no errors and carry on...
      // store our submission result...
      submissionRecord.value = { ...extractSubmissionData(response) };
    } else {
      throw new Error(
        t('trans.formViewer.sendSubmissionErrMsg', {
          status: response.status,
        })
      );
    }
  } catch (error) {
    if (
      form.value.enableOfflineSubmission &&
      isNewSubmission &&
      isNetworkError(error)
    ) {
      errMsg = await tryQueueOffline(sub, dedupKey);
    } else {
      errMsg = extractErrorMessage(error);
    }
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
  // Note: This handler is only called on successful submission (when formio.submitDone is emitted)
  // On errors, we use reRenderFormIo to reset button without triggering this handler
  if (properties.staffEditMode) {
    // updating an existing submission on the staff side
    emit('submission-updated');
    return;
  }
  const isPending =
    typeof submissionRecord.value.id === 'string' &&
    submissionRecord.value.id.startsWith('pending-');
  if (isPending) {
    router.push({
      name: 'FormSubmit',
      query: {
        f: properties.formId,
        fresh: Date.now(),
      },
    });
    return;
  }
  router.push({
    name: 'FormSuccess',
    query: {
      s: submissionRecord.value.id,
    },
  });
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

async function yes() {
  await saveDraftFromModal(true);
}

async function no() {
  await saveDraftFromModal(false);
}

async function saveDraftFromModal(event) {
  doYouWantToSaveTheDraft.value = false;
  if (event) {
    await saveDraftFromModalNow();
  } else {
    leaveThisPage();
  }
}

function notifyDraftSubmitError(error) {
  notificationStore.addNotification({
    text:
      error?.code === 'QUEUE_CAP'
        ? t('trans.offlineSubmission.errorAtCap', { cap: QUEUE_SOFT_CAP })
        : t('trans.formViewer.submittingDraftErrMsg'),
    consoleError: t('trans.formViewer.submittingDraftConsErrMsg', {
      submissionId: properties.submissionId,
      error: error,
    }),
  });
}

async function queueDraftAndLeave(dedupKey) {
  try {
    await queueSubmissionOffline(submission.value, true, dedupKey);
    leaveThisPage();
  } catch (queueError) {
    notifyDraftSubmitError(queueError);
  }
}

// Custom Event triggered from buttons with Action type "Event"
async function saveDraftFromModalNow() {
  const isNewSubmission = !properties.submissionId || properties.isDuplicate;
  const canQueueOffline = form.value.enableOfflineSubmission && isNewSubmission;
  const dedupKey = isNewSubmission ? uuidv4() : undefined;

  // Offline pre-empt: user already asked to leave, so queue then leave.
  if (canQueueOffline && !online.value) {
    await queueDraftAndLeave(dedupKey);
    return;
  }
  try {
    saving.value = true;
    await sendSubmission(true, submission.value, dedupKey);
    saving.value = false;
    // Creating a new submission in draft state
    // Go to the user form draft page
    leaveThisPage();
    showSubmitConfirmDialog.value = false;
  } catch (error) {
    // Real-offline fallback: queue then leave.
    if (canQueueOffline && isNetworkError(error)) {
      await queueDraftAndLeave(dedupKey);
      return;
    }
    notifyDraftSubmitError(error);
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
  let fileId;
  if (file?.data?.id) {
    fileId = file.data.id;
  } else if (file?.id) {
    fileId = file.id;
  } else {
    fileId = undefined;
  }
  return fileService.deleteFile(fileId);
}

async function getFile(fileId, options = {}) {
  await formStore.downloadFile(fileId, options);

  if (downloadedFile.value?.data && downloadedFile.value?.headers) {
    const blob = downloadedFile.value.data;
    const url = window.URL.createObjectURL(blob);

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
      URL.revokeObjectURL(url);
    });
  }
}

async function uploadFile(file, config = {}) {
  const uploadConfig = {
    ...config,
    formId: properties.formId,
  };
  return fileService.uploadFile(file, uploadConfig);
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

      <div v-else-if="isFormScheduleExpired && !properties.readOnly">
        <v-alert
          :text="
            isLateSubmissionAllowed
              ? $t('trans.formViewer.lateFormSubmissions')
              : formScheduleExpireMessage
          "
          prominent
          type="info"
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
            :draft-enabled="
              form.enableSubmitterDraft &&
              (online || form.enableOfflineSubmission)
            "
            :enable-offline-submission="!!form.enableOfflineSubmission"
            :form-id="form.id"
            :is-draft="submissionRecord.draft"
            :is-editing-offline-entry="isEditingOfflineEntry"
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
        <div
          class="form-wrapper"
          :class="{ 'disable-file-downloads': shouldDisableFileDownloads }"
        >
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

          <v-dialog
            v-if="
              (form.enableOfflineSubmission && !online) || isEditingOfflineEntry
            "
            v-model="showSubmitConfirmDialog"
            max-width="560"
            persistent
            @keydown.esc="showSubmitConfirmDialog = false"
          >
            <v-card class="offline-confirm-card" elevation="4">
              <v-card-title
                class="offline-confirm-title"
                :class="{ 'dir-rtl': isRTL }"
              >
                <span :lang="locale">{{
                  queueConfirmIsDraft
                    ? $t('trans.offlineSubmission.queueConfirmDraftTitle')
                    : $t('trans.offlineSubmission.queueConfirmTitle')
                }}</span>
              </v-card-title>
              <v-card-text
                class="offline-confirm-body"
                :class="{ 'dir-rtl': isRTL }"
              >
                <p class="offline-confirm-message" :lang="locale">
                  {{
                    queueConfirmIsDraft
                      ? $t('trans.offlineSubmission.queueConfirmDraftMessage')
                      : $t('trans.offlineSubmission.queueConfirmMessage')
                  }}
                </p>
                <v-text-field
                  v-model="queueNote"
                  class="offline-confirm-note"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  :label="$t('trans.offlineSubmission.queueConfirmNoteLabel')"
                  :placeholder="
                    $t('trans.offlineSubmission.queueConfirmNotePlaceholder')
                  "
                  maxlength="100"
                  :lang="locale"
                />
              </v-card-text>
              <v-card-actions
                class="offline-confirm-actions"
                :class="{ 'dir-rtl': isRTL }"
              >
                <v-spacer />
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  size="large"
                  class="px-6"
                  data-test="queue-confirm-submit"
                  @click="continueSubmit"
                >
                  <span :lang="locale">{{
                    $t('trans.offlineSubmission.queueConfirmQueue')
                  }}</span>
                </v-btn>
                <v-btn
                  variant="outlined"
                  rounded="lg"
                  size="large"
                  class="px-6"
                  data-test="queue-confirm-cancel"
                  @click="showSubmitConfirmDialog = false"
                >
                  <span :lang="locale">{{
                    $t('trans.baseDialog.cancel')
                  }}</span>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <BaseDialog
            v-else
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
            <template #text>
              <span :lang="locale">{{
                $t('trans.formViewer.submitFormWarningMsg')
              }}</span>
            </template>
            <template #button-text-continue>
              <span :lang="locale">{{ $t('trans.formViewer.submit') }}</span>
            </template>
          </BaseDialog>
          <BaseDialog
            v-model="showSaveDraftConfirmDialog"
            type="CONTINUE"
            @close-dialog="showSaveDraftConfirmDialog = false"
            @continue-dialog="confirmSaveDraft"
          >
            <template #title>
              <span :lang="locale">{{
                $t('trans.formViewer.pleaseConfirm')
              }}</span></template
            >
            <template #text>
              <span :lang="locale">{{
                $t('trans.formViewer.saveAsDraftWarningMsg')
              }}</span>
            </template>
            <template #button-text-continue>
              <span :lang="locale">{{
                $t('trans.formViewerActions.saveAsDraft')
              }}</span>
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
            :form="form"
            :form-element="formElement"
            :form-schema="formSchema"
            :json-csv="json_csv"
            :submission-version="versionIdToSubmitTo"
            @isProcessingMultiUpload="isProcessingMultiUpload"
          />

          <v-alert
            v-if="isEditingOfflineEntry"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3 offline-edit-banner"
          >
            <div class="d-flex align-center" style="width: 100%">
              <span :lang="locale">
                {{
                  editingEntry?.body?.draft
                    ? $t('trans.offlineSubmission.editingBannerTextDraft')
                    : $t('trans.offlineSubmission.editingBannerText')
                }}
                {{ $t('trans.offlineSubmission.editingBannerSyncPaused') }}
              </span>
              <v-spacer />
              <v-btn
                color="primary"
                variant="flat"
                class="mr-2"
                data-test="offline-edit-save"
                @click="saveOfflineEntry"
              >
                <span :lang="locale">{{
                  $t('trans.offlineSubmission.editingBannerSave')
                }}</span>
              </v-btn>
              <v-btn
                color="primary"
                variant="outlined"
                data-test="offline-edit-cancel"
                @click="cancelOfflineEdit"
              >
                <span :lang="locale">{{
                  $t('trans.offlineSubmission.editingBannerCancel')
                }}</span>
              </v-btn>
            </div>
          </v-alert>

          <Form
            v-if="!bulkFile"
            :key="reRenderFormIo"
            ref="chefForm"
            :class="{ 'v-locale--is-ltr': isRTL }"
            :form="renderedSchema"
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

.offline-confirm-card {
  padding: 8px 4px;
  border-radius: 14px !important;
}
.offline-confirm-title {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  padding: 20px 28px 8px !important;
  line-height: 1.3 !important;
  letter-spacing: normal !important;
}
.offline-confirm-body {
  padding: 8px 28px 12px;
  font-size: 1rem;
}
.offline-confirm-message {
  margin: 0 0 20px;
  color: rgba(0, 0, 0, 0.72);
  line-height: 1.5;
}
.offline-confirm-note {
  margin-top: 4px;

  :deep(.v-field) {
    border-radius: 8px;
  }
}
.offline-confirm-actions {
  padding: 8px 24px 20px;
  gap: 12px;
}
</style>
