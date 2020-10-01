<template>
  <div>
    <FormViewer
      :formId="formId"
      :versionId="versionId"
    />
  </div>
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
