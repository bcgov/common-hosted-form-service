<template>
  <div>
    <h1 class="my-6 text-center">{{ formName }}</h1>
    <v-alert v-if="alertShow" :type="alertType" tile dense>{{
      alertMessage
    }}</v-alert>
    <div v-if="success" class="mb-5">
      <h1>
        <v-icon large color="success">check_circle</v-icon>Your form has been
        submitted successfully
      </h1>
      <h3>
        Please keep the following Confirmation ID for your records:
        <strong>{{ confId }}</strong>
      </h3>
      <hr />
    </div>
    <Form
      :form="formSchema"
      :submission="submission"
      @submit="onSubmit"
      @submitDone="onSubmitDone"
      @submitButton="onSubmitButton"
      :options="viewerOptions"
    />
  </div>
</template>

<script>
import { Form } from 'vue-formio';
import { formService } from '@/services';

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
    success: {
      type: Boolean,
      default: false,
    },
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
      formName: '',
      formSchema: {},
      submission: {
        data: {},
      },
      currentForm: {},
      submissionRecord: {},
    };
  },
  computed: {
    viewerOptions() {
      return {
        readOnly: this.submissionId !== undefined,
        hooks: {
          beforeSubmit: this.onBeforeSubmit,
        },
      };
    },
  },
  methods: {
    // Get the data for a form submission
    async getFormData() {
      try {
        const response = await formService.getSubmission(
          this.submissionId
        );
        this.submissionRecord = Object.assign({}, response.data.submission);
        this.submission = this.submissionRecord.submission;
        this.confId = this.submissionRecord.confirmationId;
        // simulate getFormName()
        this.formName = response.data.form.name;
        // simulate getFormSchema()
        this.formSchema = response.data.version.schema;
      } catch (error) {
        console.error(`Error getting form data: ${error}`); // eslint-disable-line no-console
        this.showAlert(
          'error',
          'An error occurred fetching the submission for this form'
        );
      }
    },
    // Get form name
    async getFormName() {
      try {
        const response = await formService.readForm(this.formId);
        if (!response.data) {
          throw new Error(`No data in response. FormId: ${this.formId}`);
        }
        this.formName = response.data.name;
      } catch (error) {
        console.error(`Error getting form data: ${error}`); // eslint-disable-line no-console
        this.showAlert('error', 'An error occurred fetching this form');
      }
    },
    // Get the form definition/schema
    async getFormSchema() {
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
    onSubmitDone() {
      // Once the form is done disable the native browser "leave site" message so they can quit without getting whined at
      window.onbeforeunload = null;

      // huzzah!
      // really nothing to do, the formio button has consumed the event and updated its display
      // is there anything here for us to do?
      // console.info('onSubmitDone()') ; // eslint-disable-line no-console
      this.$router.push({
        name: 'FormView',
        query: {
          f: this.formId,
          v: this.versionId,
          s: this.submissionRecord.id,
          success: true,
        },
      });
    },
    showAlert(typ, msg) {
      this.alertShow = true;
      this.alertType = typ;
      this.alertMessage = msg;
      this.loading = false;
    },
  },
  created() {
    if (this.submissionId) {
      this.getFormData();
    } else {
      this.getFormName();
      this.getFormSchema();
      // If they're filling in a form (ie, not loading existing data into the readonly one), enable the typical "leave site" native browser warning
      window.onbeforeunload = () => true;
    }
  },
};
</script>
