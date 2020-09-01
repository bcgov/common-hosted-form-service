<template>
  <v-container>
    <div style="border: 1px solid">
      <h2>FormIO-designed form rendered here</h2>
      {{ JSON.stringify(placeholder, 0, 2) }}
    </div>
  </v-container>
</template>

<script>
import formService from '@/services/formService';

export default {
  name: 'Form Submit',
  components: {},
  props: ['formId'],
  data() {
    return {
      placeholder: '',
    };
  },
  methods: {
    async getFormDefinition() {
      try {
        // Get the form definition from the api
        const response = await await formService.getForm(this.formId);
        this.placeholder = response.data;
      } catch (error) {
        console.error(`Error getting form: ${error}`); // eslint-disable-line no-console
      }
    },
  },
  mounted() {
    this.getFormDefinition();
  },
};
</script>
