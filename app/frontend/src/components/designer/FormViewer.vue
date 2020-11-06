<template>
  <div class="form-wrapper">
    <h1 class="my-6 text-center">{{ formName }}</h1>
    <slot name="alert" />
    <Form
      :form="formSchema"
      :submission="submission"
      @submit="onSubmit"
      @submitDone="onSubmitDone"
      @submitButton="onSubmitButton"
      :options="viewerOptions"
    />
    <p v-if="version" class="text-right">Version: {{ version }}</p>
  </div>
</template>

<script>
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { Form } from 'vue-formio';

import { formService } from '@/services';

export default {
  name: 'FormViewer',
  components: {
    Form,
  },
  props: {
    formId: String,
    readOnly: Boolean,
    submissionId: String,
    versionId: String,
  },
  data() {
    return {
      formName: '',
      formSchema: {},
      submission: {
        data: {},
      },
      currentForm: {},
      submissionRecord: {},
      version: 0,
      versionIdToSubmitTo: this.versionId,
    };
  },
  computed: {
    ...mapGetters('auth', ['token']),
    viewerOptions() {
      return {
        readOnly: this.readOnly || this.submissionId !== undefined,
        hooks: {
          beforeSubmit: this.onBeforeSubmit,
        },
        // pass in options for custom components to use
        componentOptions: {
          simplefile: {
            config: Vue.prototype.$config,
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          }
        }
      };
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', ['setDirtyFlag']),
    // Get the data for a form submission
    async getFormData() {
      try {
        const response = await formService.getSubmission(this.submissionId);
        this.submissionRecord = Object.assign({}, response.data.submission);
        this.submission = this.submissionRecord.submission;
        this.formName = response.data.form.name;
        this.formSchema = response.data.version.schema;
        this.version = response.data.version.version;
      } catch (error) {
        this.addNotification({
          message: 'An error occurred fetching the submission for this form',
          consoleError: `Error loading form submission data ${this.submissionId}: ${error}`,
        });
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
          this.formName = response.data.name;
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
          this.formName = response.data.name;
          this.version = response.data.versions[0].version;
          this.versionIdToSubmitTo = response.data.versions[0].id;
          this.formSchema = response.data.versions[0].schema;
        }
      } catch (error) {
        this.addNotification({
          message: 'An error occurred fetching this form',
          consoleError: `Error loading form schema ${this.versionId}: ${error}`,
        });
      }
    },
    // event order is:
    // onSubmitButton
    // onBeforeSubmit
    // if no errors: onSubmit -> onSubmitDone
    // else onSubmitError
    onSubmitButton(event) {
      // this is our first event in the submission chain.
      // most important thing here is ensuring that the formio form does not have an action, or else it POSTs to that action.
      // console.info('onSubmitButton()') ; // eslint-disable-line no-console
      this.currentForm = event.instance.parent.root;
      this.currentForm.form.action = undefined;
    },
    async onBeforeSubmit(submission, next) {
      // console.info(`onBeforeSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      // since we are not using formio api
      // we should do the actual submit here, and return next or parse our errors and show with next(errors)

      const errors = [];
      try {
        const body = {
          draft: false,
          submission: submission,
        };

        const response = await formService.createSubmission(
          this.formId,
          this.versionIdToSubmitTo,
          body
        );

        if (response.status === 201) {
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
      this.$router.push({
        name: 'FormSuccess',
        query: {
          s: this.submissionRecord.id,
        },
      });
    },
  },
  created() {
    if (this.submissionId) {
      this.getFormData();
    } else {
      this.getFormSchema();
      // If they're filling in a form (ie, not loading existing data into the readonly one), enable the typical "leave site" native browser warning
      window.onbeforeunload = () => true;
    }
  },
};
</script>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import 'https://unpkg.com/formiojs@4.11.2/dist/formio.builder.min.css';

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
