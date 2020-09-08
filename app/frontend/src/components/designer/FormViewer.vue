<template>
  <div>
    <v-alert v-if="alertShow" :type="alertType" tile dense>{{ alertMessage }}</v-alert>

    <Form
      :form="formSchema"
      :submission="submission"
      @change="onChangeMethod"
      @submit="onSubmitMethod"
      :options="viewerOptions"
    />
  </div>
</template>

<script>
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
      formSchema: {},
      submission: {
        data: {},
      },
    };
  },
  computed: {
    viewerOptions() {
      return { readOnly: this.submissionId !== undefined };
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
        this.submission = response.data.submission;
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
    onChangeMethod(change) {
      const changed = change.changed;
      if (changed) {
        this.submission.data[changed.instance.path] = changed.value;
      }
    },
    async onSubmitMethod() {
      try {
        const body = {
          draft: false,
          submission: {
            data: this.submission.data,
          },
        };
        const response = await formService.createSubmission(
          this.formId,
          this.versionId,
          body
        );
        if (response.status === 201) {
          this.showAlert(
            'success',
            'Your form has been successfully submitted (UX here TBD)'
          );
        }
      } catch (error) {
        console.error(`Error creating new submission: ${error}`); // eslint-disable-line no-console
        this.showAlert('error', 'An error occurred submitting this form');
        throw error;
      }
    },
    showAlert(typ, msg) {
      this.alertShow = true;
      this.alertType = typ;
      this.alertMessage = msg;
      this.loading = false;
    },
  },
  mounted() {
    this.getFormDefinition();
    if (this.submissionId) {
      this.getFormData();
    }
  },
};
</script>
