<template>
  <v-container>
    <v-alert v-if="alertShow" :type="alertType" tile dense>{{ alertMessage }}</v-alert>

    <Formio
      :form="formSchema"
      :submission="submission"
      @change="onChangeMethod"
      @submit="onSubmitMethod"
      :options="{}"
    />
  </v-container>
</template>

<script>
import { Form } from 'vue-formio';
import formService from '@/services/formService';

export default {
  name: 'FormSubmit',
  components: {
    Formio: Form,
  },
  props: ['formId', 'versionId'],
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
  methods: {
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
        const response = await formService.createSubmission(
          this.formId,
          this.versionId,
          this.submission.data
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
  },
};
</script>
