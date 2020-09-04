<template>
  <v-container>
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
      placeholder: '',
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
        this.formSchema = response.data.schema;
      } catch (error) {
        console.error(`Error getting form schema: ${error}`); // eslint-disable-line no-console
      }
    },
  },
  mounted() {
    this.getFormDefinition();
  },
};
</script>
