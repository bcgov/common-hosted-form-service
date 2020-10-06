<template>
  <div>
    <h1 class="my-6 text-center">Form Designer</h1>
    <FormDesigner :formId="f" :versionId="v" />
  </div>
</template>

<script>
import FormDesigner from '@/components/designer/FormDesigner.vue';

export default {
  name: 'Designer',
  components: {
    FormDesigner,
  },
  props: {
    f: String,
    v: String,
  },
};
</script>
