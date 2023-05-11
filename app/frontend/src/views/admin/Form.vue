<template>
  <v-container>
    <h1 class="mt-6">Administer Form</h1>
    <AdministerForm :form-id="f" />
  </v-container>
</template>

<script>
import AdministerForm from '@src/components/admin/AdministerForm.vue';

export default {
  name: 'AdminFormView',
  components: {
    AdministerForm,
  },
  props: {
    f: String,
  },
};
</script>
