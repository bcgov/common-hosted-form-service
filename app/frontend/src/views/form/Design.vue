<template>
  <BaseSecure>
    <FormDesigner class="mt-6" :formId="f" :versionId="v" />
  </BaseSecure>
</template>

<script>
import FormDesigner from '@/components/designer/FormDesigner.vue';

export default {
  name: 'FormDesign',
  components: {
    FormDesigner,
  },
  props: {
    f: String,
    v: String,
  },
};
</script>
