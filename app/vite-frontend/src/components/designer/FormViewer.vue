<script setup>
import { Form } from '@formio/vue';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUpdate, onBeforeUnmount, ref } from 'vue';

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

const props = defineProps({
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

const confirmSubmit = ref(false);
const currentForm = ref({});
const forceNewTabLinks = ref(true);
const form = ref({});
const formSchema = ref({});
const loadingSubmission = ref(false);
const permissions = ref([]);
const reRenderFormIo = ref(0);
const saving = ref(false);
const showSubmitConfirmDialog = ref(false);
const submission = ref({ data: { lateEntry: false } });
const submissionRecord = ref({});
const version = ref(0);
const versionIdToSubmitTo = ref(props.versionId);
const isFormScheduleExpired = ref(false);
const formScheduleExpireMessage = ref(
  'Form submission is not available as the scheduled submission period has expired.'
);
const isLateSubmissionAllowed = ref(false);

const appStore = useAppStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const router = getRouter();

const { config } = storeToRefs(appStore);
const { authenticated } = storeToRefs(authStore);

const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);
const viewerOptions = computed(() => {
  return {
    sanitizeConfig: {
      addTags: ['iframe'],
      ALLOWED_TAGS: ['iframe'],
    },
    templates: templateExtensions,
    readOnly: props.readOnly,
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
    !props.readOnly &&
    permissions.value.includes(FormPermissions.SUBMISSION_UPDATE)
);

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
    const response = await formService.getSubmission(props.submissionId);
    submissionRecord.value = Object.assign({}, response.data.submission);
    submission.value = submissionRecord.value.submission;
    form.value = response.data.form;
    if (!props.isDuplicate) {
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
    if (!props.staffEditMode && !isFormPublic(form.value)) {
      const permRes = await rbacService.getUserSubmissions({
        formSubmissionId: props.submissionId,
      });
      permissions.value = permRes.data[0] ? permRes.data[0].permissions : [];
    }
  } catch (error) {
    notificationStore.addNotification({
      text: 'An error occurred fetching the submission for this form',
      consoleError: `Error loading form submission data ${props.submissionId}: ${error}`,
    });
  } finally {
    loadingSubmission.value = false;
  }
}

// Get the form definition/schema
async function getFormSchema() {
  try {
    let response = undefined;
    if (props.versionId) {
      versionIdToSubmitTo.value = props.versionId;
      // If getting for a specific older version of the form
      response = await formService.readVersion(props.formId, props.versionId);
      if (!response.data || !response.data.schema) {
        throw new Error(`No schema in response. VersionId: ${props.versionId}`);
      }
      form.value = response.data;
      version.value = response.data.version;
      formSchema.value = response.data.schema;
    } else if (props.draftId) {
      // If getting for a specific draft version of the form for preview
      response = await formService.readDraft(props.formId, props.draftId);
      if (!response.data || !response.data.schema) {
        throw new Error(`No schema in response. DraftId: ${props.draftId}`);
      }
      form.value = response.data;
      formSchema.value = response.data.schema;
    } else {
      // If getting the HEAD form version (IE making a new submission)
      response = await formService.readPublished(props.formId);
      if (
        !response.data ||
        !response.data.versions ||
        !response.data.versions[0]
      ) {
        router.push({
          name: 'Alert',
          query: {
            text:
              'The form owner has not published the form, and it is not ' +
              'available for submissions.',
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
  } catch (error) {
    if (authenticated.value) {
      isFormScheduleExpired.value = true;
      isLateSubmissionAllowed.value = false;
      formScheduleExpireMessage.value = error.message;
      notificationStore.addNotification({
        text: 'An error occurred fetching this form',
        consoleError: `Error loading form schema ${props.versionId}: ${error}`,
      });
    }
  }
}

async function saveDraft() {
  try {
    saving.value = true;
    const response = await sendSubmission(true, submission.value);
    if (props.submissionId) {
      // Editing an existing draft
      // Update this route with saved flag
      if (!props.saved) {
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
      text: 'An error occurred while saving a draft',
      consoleError: `Error saving draft. SubmissionId: ${props.submissionId}. Error: ${error}`,
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
  if (props.submissionId && !props.isDuplicate) {
    // Updating an existing submission
    response = await formService.updateSubmission(props.submissionId, body);
  } else {
    // Adding a new submission
    response = await formService.createSubmission(
      props.formId,
      versionIdToSubmitTo.value,
      body
    );
  }
  return response;
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
  if (props.preview) {
    alert('Submission disabled during form preview');
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
  if (props.preview) {
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
  if (props.preview) {
    alert('Submission disabled during form preview');
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
      consoleError: `Error submiting the form: ${errors}`,
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
        props.submissionId && props.isDuplicate //Check if this submission is creating with the existing one
          ? response.data
          : props.submissionId && !props.isDuplicate
          ? response.data.submission
          : response.data
      );
    } else {
      throw new Error(
        `Failed response from submission endpoint. Response code: ${response.status}`
      );
    }
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    errMsg = 'An error occurred submitting this form';
  }
  return errMsg;
}

async function onSubmitDone() {
  // huzzah!
  // really nothing to do, the formio button has consumed the event and updated its display
  // is there anything here for us to do?
  // console.info('onSubmitDone()') ; // eslint-disable-line no-console
  if (props.staffEditMode) {
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
  alert(`Custom button events not supported yet. Event Type: ${event.type}`);
}

function beforeWindowUnload(e) {
  if (!props.preview && !props.readOnly) {
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

if (props.submissionId && props.isDuplicate) {
  //Run when make new submission from existing one called.
  Promise.all([
    getFormData(),
    getFormSchema(), //We need this to be called as well, because we need latest version of form
  ]);
} else if (props.submissionId && !props.isDuplicate) {
  getFormData();
} else {
  getFormSchema();
}

// If they're filling in a form (ie, not loading existing data into the readonly one), enable the typical "leave site" native browser warning
if (!props.preview && !props.readOnly) {
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
              ? 'The form submission period has expired! You can still create a late submission by clicking the button below.'
              : formScheduleExpireMessage
          "
          prominent
          type="error"
        >
        </v-alert>

        <div v-if="isLateSubmissionAllowed">
          <v-col cols="3" md="2">
            <v-btn color="primary" @click="isFormScheduleExpired = false">
              <span>Create late submission</span>
            </v-btn>
          </v-col>
        </div>
      </div>

      <div v-else>
        <div v-if="displayTitle">
          <div v-if="!isFormPublic(form)">
            <FormViewerActions
              :draft-enabled="form.enableSubmitterDraft"
              :copy-existing-submission="form.enableCopyExistingSubmission"
              :form-id="form.id"
              :is-draft="submissionRecord.draft"
              :permissions="permissions"
              :read-only="readOnly"
              :submission-id="submissionId"
              @save-draft="saveDraft"
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
              Saving
            </div>
            <div v-else>Draft Saved</div>
          </v-alert>

          <slot name="alert" :form="form" />

          <BaseDialog
            v-model="showSubmitConfirmDialog"
            type="CONTINUE"
            :enable-custom-button="canSaveDraft"
            @close-dialog="showSubmitConfirmDialog = false"
            @continue-dialog="continueSubmit"
          >
            <template #title>Please Confirm</template>
            <template #text
              >Are you sure you wish to submit your form?</template
            >
            <template #button-text-continue>
              <span>Submit</span>
            </template>
          </BaseDialog>

          <Form
            :key="reRenderFormIo"
            :form="formSchema"
            :submission="submission"
            :options="viewerOptions"
            @submit="onSubmit"
            @submitDone="onSubmitDone"
            @submitButton="onSubmitButton"
            @customEvent="onCustomEvent"
          />
          <p v-if="version" class="text-right">Version: {{ version }}</p>
        </div>
      </div>
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
