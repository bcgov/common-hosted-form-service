<template>
  <div>
    <h1 class="my-6 text-center">Create New Form</h1>
    <FormSettings />
  </div>
</template>

<script>
import FormSettings from '@/components/designer/FormSettings.vue';

export default {
  name: 'FormCreate',
  components: {
    FormSettings,
  },
};
</script>
