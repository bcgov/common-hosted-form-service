<template>
  <BaseSecure>
    <FormViewer :draftId="d" :formId="f" preview :versionId="v" />
  </BaseSecure>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormPreview',
  props: {
    d: String,
    f: String,
    v: String,
  },
  components: {
    FormViewer,
  }
};
</script>
