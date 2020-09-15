<template>
  <JFormDesigner :formId="formId" :formVersionId="formVersionId" />
</template>

<script>
import JFormDesigner from '@/components/designer/JFormDesigner.vue';

export default {
  name: 'Editor',
  components: {
    JFormDesigner
  },
  props: {
    formId: String,
    formVersionId: String
  }
};
</script>
