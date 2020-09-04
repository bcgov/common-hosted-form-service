<template>
  <v-container>
    <v-alert v-if="alertShow" :type="alertType" tile dense>{{ alertMessage }}</v-alert>

    <Formio :form="formSchema" :options="{ readOnly: false }" />
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
        if(!response.data || ! response.data.schema) {
          throw new Error(`No schema in response. VersionId: ${this.versionId}`);
        }
        this.formSchema = response.data.schema;
      } catch (error) {
        console.error(`Error getting form schema: ${error}`); // eslint-disable-line no-console
        this.showTableAlert('error', 'An error occurred fetching this form');
      }
    },
    showTableAlert(typ, msg) {
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
