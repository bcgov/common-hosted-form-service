<template>
  <v-skeleton-loader :loading="loadingSubmission" type="article, actions">
    <div v-if="displayTitle">
      <div v-if="!isFormPublic(form)">
        <FormViewerActions
          :draftEnabled="form.enableSubmitterDraft"
          :formId="form.id"
          :isDraft="submissionRecord.draft"
          :permissions="permissions"
          :readOnly="readOnly"
          :submissionId="submissionId"
          @save-draft="saveDraft"
        />
      </div>
      <h1 class="my-6 text-center">{{ form.name }}</h1>
    </div>
    <div class="form-wrapper">
      <v-alert
        :value="saved || saving"
        :class="
          saving
            ? NOTIFICATIONS_TYPES.INFO.class
            : NOTIFICATIONS_TYPES.SUCCESS.class
        "
        :color="
          saving
            ? NOTIFICATIONS_TYPES.INFO.color
            : NOTIFICATIONS_TYPES.SUCCESS.color
        "
        :icon="
          saving
            ? NOTIFICATIONS_TYPES.INFO.icon
            : NOTIFICATIONS_TYPES.SUCCESS.icon
        "
        transition="scale-transition"
      >
        <div v-if="saving">
          <v-progress-linear indeterminate />
          Saving
        </div>
        <div v-else>Draft Saved</div>
      </v-alert>

      <slot name="alert" v-bind:form="form" />

      <BaseDialog
        v-model="showSubmitConfirmDialog"
        type="CONTINUE"
        @close-dialog="showSubmitConfirmDialog = false"
        @continue-dialog="continueSubmit"
      >
        <template #title>Please Confirm</template>
        <template #text>Are you sure you wish to submit your form?</template>
        <template #button-text-continue>
          <span>Submit</span>
        </template>
      </BaseDialog>

      <Form
        :form="formSchema"
        :key="reRenderFormIo"
        :submission="submission"
        @submit="onSubmit"
        @submitDone="onSubmitDone"
        @submitButton="onSubmitButton"
        @customEvent="onCustomEvent"
        :options="viewerOptions"
      />
      <p v-if="version" class="text-right">Version: {{ version }}</p>
    </div>
  </v-skeleton-loader>
</template>

<script>
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { Form } from 'vue-formio';

import templateExtensions from '@/plugins/templateExtensions';
import { formService, rbacService } from '@/services';
import FormViewerActions from '@/components/designer/FormViewerActions.vue';
import { isFormPublic } from '@/utils/permissionUtils';
import { attachAttributesToLinks } from '@/utils/transformUtils';
import { NotificationTypes } from '@/utils/constants';

export default {
  name: 'FormViewer',
  components: {
    Form,
    FormViewerActions,
  },
  props: {
    displayTitle: {
      type: Boolean,
      default: false,
    },
    draftId: String,
    formId: String,
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
    submissionId: String,
    versionId: String,
  },
  data() {
    return {
      confirmSubmit: false,
      currentForm: {},
      forceNewTabLinks: true,
      form: {},
      formSchema: {},
      loadingSubmission: false,
      permissions: [],
      reRenderFormIo: 0,
      saving: false,
      showSubmitConfirmDialog: false,
      submission: {
        data: {},
      },
      submissionRecord: {},
      version: 0,
      versionIdToSubmitTo: this.versionId,
    };
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'token', 'tokenParsed', 'user']),
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
    viewerOptions() {
      return {
        sanitizeConfig: {
          addTags: ['iframe'],
          ALLOWED_TAGS: ['iframe'],
        },
        templates: templateExtensions,
        readOnly: this.readOnly,
        hooks: {
          beforeSubmit: this.onBeforeSubmit,
        },
        // pass in options for custom components to use
        componentOptions: {
          simplefile: {
            config: Vue.prototype.$config,
            chefsToken: this.getCurrentAuthHeader
          },
        },
        evalContext: {
          token: this.tokenParsed,
          user: this.user,
        },
      };
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    isFormPublic: isFormPublic,
    // Get the data for a form submission
    getCurrentAuthHeader() {
      return `Bearer ${this.token}`;
    },
    async getFormData() {
      try {
        this.loadingSubmission = true;
        const response = await formService.getSubmission(this.submissionId);
        this.submissionRecord = Object.assign({}, response.data.submission);
        this.submission = this.submissionRecord.submission;
        this.form = response.data.form;
        this.formSchema = response.data.version.schema;
        this.version = response.data.version.version;
        // Get permissions
        if (!this.staffEditMode && !isFormPublic(this.form)) {
          const permRes = await rbacService.getUserSubmissions({
            formSubmissionId: this.submissionId,
          });
          this.permissions = permRes.data[0] ? permRes.data[0].permissions : [];
        }
      } catch (error) {
        this.addNotification({
          message: 'An error occurred fetching the submission for this form',
          consoleError: `Error loading form submission data ${this.submissionId}: ${error}`,
        });
      } finally {
        this.loadingSubmission = false;
      }
    },
    // Get the form definition/schema
    async getFormSchema() {
      try {
        let response = undefined;
        if (this.versionId) {
          this.versionIdToSubmitTo = this.versionId;
          // If getting for a specific older version of the form
          response = await formService.readVersion(this.formId, this.versionId);
          if (!response.data || !response.data.schema) {
            throw new Error(
              `No schema in response. VersionId: ${this.versionId}`
            );
          }
          this.form = response.data;
          this.formSchema = response.data.schema;
        } else if (this.draftId) {
          // If getting for a specific draft version of the form for preview
          response = await formService.readDraft(this.formId, this.draftId);
          if (!response.data || !response.data.schema) {
            throw new Error(`No schema in response. DraftId: ${this.draftId}`);
          }
          this.form = response.data;
          this.formSchema = response.data.schema;
        } else {
          // If getting the HEAD form version (IE making a new submission)
          response = await formService.readPublished(this.formId);
          if (
            !response.data ||
            !response.data.versions ||
            !response.data.versions[0]
          ) {
            throw new Error(
              `No published version found in response. FormID: ${this.formId}`
            );
          }
          this.form = response.data;
          this.version = response.data.versions[0].version;
          this.versionIdToSubmitTo = response.data.versions[0].id;
          this.formSchema = response.data.versions[0].schema;
        }
      } catch (error) {
        if (this.authenticated) {
          this.addNotification({
            message: 'An error occurred fetching this form',
            consoleError: `Error loading form schema ${this.versionId}: ${error}`,
          });
        }
      }
    },
    async saveDraft() {
      try {
        this.saving = true;
        const response = await this.sendSubmission(true, this.submission);
        if (this.submissionId) {
          // Editing an existing draft
          // Update this route with saved flag
          if (!this.saved) {
            this.$router.replace({
              name: 'UserFormDraftEdit',
              query: { ...this.$route.query, sv: true },
            });
          }
          this.saving = false;
        } else {
          // Creating a new submission in draft state
          // Go to the user form draft page
          this.$router.push({
            name: 'UserFormDraftEdit',
            query: {
              s: response.data.id,
              sv: true,
            },
          });
        }
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while saving a draft',
          consoleError: `Error saving draft. SubmissionId: ${this.submissionId}. Error: ${error}`,
        });
      }
    },
    async sendSubmission(isDraft, submission) {
      const body = {
        draft: isDraft,
        submission: submission,
      };

      let response;
      if (this.submissionId) {
        // Updating an existing submission
        response = await formService.updateSubmission(this.submissionId, body);
      } else {
        // Adding a new submission
        response = await formService.createSubmission(
          this.formId,
          this.versionIdToSubmitTo,
          body
        );
      }
      return response;
    },

    // -----------------------------------------------------------------------------------------
    // FormIO Events
    // -----------------------------------------------------------------------------------------
    // https://help.form.io/developers/form-renderer#form-events
    // event order is:
    // onSubmitButton
    // onBeforeSubmit
    // if no errors: onSubmit -> onSubmitDone
    // else onSubmitError
    onSubmitButton(event) {
      if (this.preview) {
        alert('Submission disabled during form preview');
        return;
      }
      // this is our first event in the submission chain.
      // most important thing here is ensuring that the formio form does not have an action, or else it POSTs to that action.
      // console.info('onSubmitButton()') ; // eslint-disable-line no-console
      this.currentForm = event.instance.parent.root;
      this.currentForm.form.action = undefined;

      // if form has drafts enabled in form settings, show 'confirm submit?' dialog
      if (this.form.enableSubmitterDraft) {
        this.showSubmitConfirmDialog = true;
      }
    },

    // If the confirm modal pops up on drafts
    continueSubmit() {
      this.confirmSubmit = true;
      this.showSubmitConfirmDialog = false;
    },

    // formIO hook, prior to a submission occurring
    // We can cancel a formIO submission event here, or go on
    async onBeforeSubmit(submission, next) {
      // dont do anything if previewing the form
      if (this.preview) {
        // Force re-render form.io to reset submit button state
        this.reRenderFormIo += 1;
        return;
      }

      // if form has drafts enabled in form setttings,
      if (this.form.enableSubmitterDraft) {
        // while 'confirm submit?' dialog is open..
        while (this.showSubmitConfirmDialog) {
          // await a promise that never resolves to block this thread
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        if (this.confirmSubmit) {
          this.confirmSubmit = false; // clear for next attempt
          next();
        } else {
          // Force re-render form.io to reset submit button state
          this.reRenderFormIo += 1;
        }
      } else {
        next();
      }
    },

    // FormIO submit event
    // eslint-disable-next-line no-unused-vars
    async onSubmit(submission) {
      if (this.preview) {
        alert('Submission disabled during form preview');
        return;
      }

      const errors = await this.doSubmit(submission);

      // if we are here, the submission has been saved to our db
      // the passed in submission is the formio submission, not our db persisted submission record...
      // fire off the submitDone event.
      // console.info(`onSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      if (errors) {
        this.addNotification({
          message: errors,
          consoleError: `Error submiting the form: ${errors}`,
        });
      } else {
        this.currentForm.events.emit('formio.submitDone');
      }
    },

    // Not a formIO event, our saving routine to POST the submission to our API
    async doSubmit(submission) {
      // console.info(`doSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      // since we are not using formio api
      // we should do the actual submit here, and return any error that occurrs to handle in the submit event
      let errMsg = undefined;
      try {
        const response = await this.sendSubmission(false, submission);

        if ([200, 201].includes(response.status)) {
          // all is good, flag no errors and carry on...
          // store our submission result...
          this.submissionRecord = Object.assign(
            {},
            this.submissionId ? response.data.submission : response.data
          );
          // console.info(`doSubmit:submissionRecord = ${JSON.stringify(this.submissionRecord)}`) ; // eslint-disable-line no-console
        } else {
          // console.error(response); // eslint-disable-line no-console
          throw new Error(`Failed response from submission endpoint. Response code: ${response.status}`);
        }
      } catch (error) {
        console.error(error); // eslint-disable-line no-console
        errMsg = 'An error occurred submitting this form';
      }
      return errMsg;
    },

    async onSubmitDone() {
      // huzzah!
      // really nothing to do, the formio button has consumed the event and updated its display
      // is there anything here for us to do?
      // console.info('onSubmitDone()') ; // eslint-disable-line no-console
      if (this.staffEditMode) {
        // updating an existing submission on the staff side
        this.$emit('submission-updated');
      } else {
        // User created new submission
        this.$router.push({
          name: 'FormSuccess',
          query: {
            s: this.submissionRecord.id,
          },
        });
      }
    },
    // Custom Event triggered from buttons with Action type "Event"
    onCustomEvent(event) {
      alert(
        `Custom button events not supported yet. Event Type: ${event.type}`
      );
    },
  },
  created() {
    if (this.submissionId) {
      this.getFormData();
    } else {
      this.getFormSchema();
    }
    // If they're filling in a form (ie, not loading existing data into the readonly one), enable the typical "leave site" native browser warning
    if (!this.preview && !this.readOnly) {
      window.onbeforeunload = () => true;
    }
  },
  beforeUpdate() {
    // This needs to be ran whenever we have a formSchema change
    if (this.forceNewTabLinks) {
      attachAttributesToLinks(this.formSchema.components);
    }
  },
};
</script>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.form.min.css';

.form-wrapper ::v-deep .formio-form {
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
