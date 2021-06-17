<template>
  <div class="form-wrapper">
    <v-skeleton-loader :loading="loadingSubmission" type="article, actions">
      <div v-if="displayTitle">
        <div v-if="!isFormPublic(form)" class="text-right" cols="12" sm="6">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{ name: 'UserSubmissions', query: { f: form.id } }"
              >
                <v-btn
                  class="mx-1"
                  color="primary"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>list_alt</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>View your Previous Submissions</span>
          </v-tooltip>
        </div>

        <h1 class="mb-6 text-center">{{ form.name }}</h1>
      </div>

      <slot name="alert" v-bind:form="form" />

      <Form
        :form="formSchema"
        :submission="submission"
        @submit="onSubmit"
        @submitDone="onSubmitDone"
        @submitButton="onSubmitButton"
        @customEvent="onCustomEvent"
        :options="viewerOptions"
      />
      <p v-if="version" class="text-right">Version: {{ version }}</p>
    </v-skeleton-loader>
  </div>
</template>

<script>
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { Form } from 'vue-formio';

import { formService } from '@/services';
import { isFormPublic } from '@/utils/permissionUtils';

export default {
  name: 'FormViewer',
  components: {
    Form,
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
    submissionId: String,
    versionId: String,
  },
  data() {
    return {
      form: {},
      formSchema: {},
      submission: {
        data: {},
      },
      currentForm: {},
      loadingSubmission: false,
      submissionRecord: {},
      version: 0,
      versionIdToSubmitTo: this.versionId,
    };
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'token']),
    viewerOptions() {
      return {
        readOnly: this.readOnly,
        hooks: {
          beforeSubmit: this.onBeforeSubmit,
        },
        // pass in options for custom components to use
        componentOptions: {
          simplefile: {
            config: Vue.prototype.$config,
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        },
      };
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', ['setDirtyFlag']),
    isFormPublic: isFormPublic,
    // Get the data for a form submission
    async getFormData() {
      try {
        this.loadingSubmission = true;
        const response = await formService.getSubmission(this.submissionId);
        this.submissionRecord = Object.assign({}, response.data.submission);
        this.submission = this.submissionRecord.submission;
        this.form = response.data.form;
        this.formSchema = response.data.version.schema;
        this.version = response.data.version.version;
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

    // -----------------------------------------------------------------------------------------
    // FormIO Events
    // -----------------------------------------------------------------------------------------
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
    },
    async onBeforeSubmit(submission, next) {
      if (this.preview) {
        return;
      }
      // console.info(`onBeforeSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      // since we are not using formio api
      // we should do the actual submit here, and return next or parse our errors and show with next(errors)

      const errors = [];
      try {
        const body = {
          draft: false,
          submission: submission,
        };

        let response;
        if (this.submissionId) {
          // Updating an existing submission
          response = await formService.updateSubmission(
            this.submissionId,
            body
          );
        } else {
          // Adding a new submission
          response = await formService.createSubmission(
            this.formId,
            this.versionIdToSubmitTo,
            body
          );
        }

        if ([200, 201].includes(response.status)) {
          // all is good, let's just call next() and carry on...
          // store our submission result...
          this.submissionRecord = Object.assign({}, response.data);
          // console.info(`onBeforeSubmit:submissionRecord = ${JSON.stringify(this.submissionRecord)}`) ; // eslint-disable-line no-console
          next();
        } else {
          // console.error(response); // eslint-disable-line no-console
          errors.push('An error occurred submitting this form');
        }
      } catch (error) {
        // console.error(error); // eslint-disable-line no-console
        errors.push('An error occurred submitting this form');
      }

      if (errors.length) {
        next(errors);
      }
    },
    // eslint-disable-next-line no-unused-vars
    async onSubmit(submission) {
      if (this.preview) {
        alert('Submission disabled during form preview');
        return;
      }
      // if we are here, the submission has been saved to our db
      // the passed in submission is the formio submission, not our db persisted submission record...
      // fire off the submitDone event.
      // console.info(`onSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      this.currentForm.events.emit('formio.submitDone');
    },
    async onSubmitDone() {
      // huzzah!
      // really nothing to do, the formio button has consumed the event and updated its display
      // is there anything here for us to do?
      // console.info('onSubmitDone()') ; // eslint-disable-line no-console
      if (this.submissionId) {
        // updating an existing submission
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
      // If they're filling in a form (ie, not loading existing data into the readonly one), enable the typical "leave site" native browser warning
      if (!this.preview) {
        window.onbeforeunload = () => true;
      }
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
