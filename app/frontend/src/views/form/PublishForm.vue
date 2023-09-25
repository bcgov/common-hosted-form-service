<template>
  <BaseStepper :step="3">
    <template v-slot:manageForm>
      <ManageForm />
    </template>
  </BaseStepper>
</template>

<script>
import ManageForm from '@/components/forms/manage/ManageForm.vue';
export default {
  name: 'PublishForm',
  components: {
    ManageForm,
  },
};
</script>
