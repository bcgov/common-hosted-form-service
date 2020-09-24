<template>
  <div>
    <p v-if="submissionId">
      <strong>Confirmation ID:</strong>
      {{ formSubmission.confirmationId }}
      <br />
      <strong>Submitted By:</strong>
      {{ formSubmission.createdBy }}
      <br />
      <strong>Submitted Date:</strong>
      {{ formSubmission.createdAt | formatDateLong }}
    </p>

    <Form
      :form="formSchema"
      :submission="submission"
      @submit="onSubmit"
      @submitDone="onSubmitDone"
      @submitButton="onSubmitButton"
      @submitError="onSubmitError"
      :options="viewerOptions"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { Form } from 'vue-formio';
import formService from '@/services/formService';

export default {
  name: 'FormViewer',
  components: {
    Form,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
    submissionId: String,
    versionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      alertMessage: '',
      alertShow: false,
      alertType: null,
      confId: '',
      formSchema: {},
      submission: {
        data: {}
      },
      currentForm: {},
      submissionRecord: {}
    };
  },
  computed: {
    ...mapGetters('form', ['formSubmission', 'version']),
    viewerOptions() {
      return {
        readOnly: this.submissionId !== undefined,
        hooks: {
          beforeSubmit: this.onBeforeSubmit
        }
      };
    },
  },
  methods: {
    // Get the data for a form submission
    async getFormData() {
      try {
        const response = await formService.getSubmission(
          this.formId,
          this.versionId,
          this.submissionId
        );
        this.submissionRecord = Object.assign({}, response.data);
        this.submission = this.submissionRecord.submission;
        this.confId = this.submissionRecord.confirmationId;
      } catch (error) {
        console.error(`Error getting form data: ${error}`); // eslint-disable-line no-console
        this.showAlert(
          'error',
          'An error occurred fetching the submission for this form'
        );
      }
    },
    // Get the form definition/schema
    async getFormDefinition() {
      try {
        const response = await formService.readVersion(
          this.formId,
          this.versionId
        );
        if (!response.data || !response.data.schema) {
          throw new Error(
            `No schema in response. VersionId: ${this.versionId}`
          );
        }
        this.formSchema = response.data.schema;
      } catch (error) {
        console.error(`Error getting form schema: ${error}`); // eslint-disable-line no-console
        this.showAlert('error', 'An error occurred fetching this form');
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
    viewerReady() {
      if (this.submissionId) {
        return this.version && this.version.schema && this.formSubmission.submission;
      } else {
        return this.version && this.version.schema;
      }
    },
  },
  methods: {
    ...mapActions('form', ['fetchSubmission', 'fetchVersion']),
    async onSubmitMethod() {
      try {
        const body = {
          draft: false,
          submission: this.formSubmission.submission,
        };

        const response = await formService.createSubmission(
          this.formId,
          this.versionId,
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
        console.error(`Error creating new submission: ${error}`); // eslint-disable-line no-console
        throw error;
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
    onSubmitDone() {
      // huzzah!
      // really nothing to do, the formio button has consumed the event and updated its display
      // is there anything here for us to do?
      // console.info('onSubmitDone()') ; // eslint-disable-line no-console
      this.$router.push({
        name: 'FormSubmissionView',
        params: {
          formId: this.formId,
          versionId: this.versionId,
          submissionId: this.submissionRecord.id,
        },
        query: { success: true },
      });
    },
  },
  async mounted() {
    this.fetchVersion({ formId: this.formId, versionId: this.versionId });
    if (this.submissionId) {
      await this.fetchSubmission({
        formId: this.formId,
        versionId: this.versionId,
        submissionId: this.submissionId,
      });
    }
  },
};
</script>
