<template>
  <div>
    <FormDesigner class="mt-6" :formId="f" :versionId="v" />
  </div>
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
