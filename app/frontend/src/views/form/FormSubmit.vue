<template>
  <v-container>
    <FormViewer
      :formId="formId"
      :versionId="versionId"
    />
  </v-container>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormSubmit',
  components: {
    FormViewer,
  },
  props: ['formId', 'versionId'],
};
</script>
