<template>
  <v-container>
    <h1 class="my-6 text-center">Editor</h1>
    <!-- TODO: Change from hardcoded values to props -->
    <FormDesigner
      formId="b1cff682-1412-442a-ac6a-cd70baa35022"
      formVersionId="544cb861-a435-4f34-8994-49a0723de0b7"
    />
  </v-container>
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
