<!-- TODO: Remove this temporary scaffold view -->
<template>
  <div>
    <h1 class="my-6 text-center">Form Edit</h1>
    <FormSettings :formId="f" />
  </div>
</template>

<script>
import FormSettings from '@/components/designer/FormSettings.vue';

export default {
  name: 'Settings',
  components: {
    FormSettings,
  },
  props: {
    f: String
  },
};
</script>
