<template>
  <FormDesigner :formId="formId" :formVersionId="formVersionId" />
</template>

<script>
import FormDesigner from '@/components/designer/FormDesigner.vue';

export default {
  name: 'Editor',
  components: {
    FormDesigner
  },
  props: {
    formId: String,
    formVersionId: String
  }
};
</script>
