<script>
import AdministerForm from '~/components/admin/AdministerForm.vue';

export default {
  components: {
    AdministerForm,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
};
</script>

<template>
  <v-container>
    <h1 class="mt-6">Administer Form</h1>

    <AdministerForm :form-id="f" />
  </v-container>
</template>
