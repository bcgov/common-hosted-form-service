<template>
  <div>
    <h1 class="my-6 text-center">Create New Form</h1>
    <!-- TODO: Lift stepper logic here and use newer separated components! -->
    <FormCreator />
  </div>
</template>

<script>
import FormCreator from '@/components/designer/FormCreator.vue';

export default {
  name: 'FormCreate',
  components: {
    FormCreator,
  },
};
</script>
