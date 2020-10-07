<template>
  <div>
    <h1 class="my-6 text-center">Form Edit</h1>
    <FormEditor :formId="f" />
  </div>
</template>

<script>
import FormEditor from '@/components/designer/FormEditor.vue';

export default {
  name: 'FormEdit',
  components: {
    FormEditor,
  },
  props: {
    f: String
  },
};
</script>
