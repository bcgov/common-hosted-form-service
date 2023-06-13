<script setup>
import AdministerForm from '~/components/admin/AdministerForm.vue';

defineProps({
  f: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <v-container>
    <h1 class="mt-6">Administer Form</h1>

    <AdministerForm :form-id="f" />
  </v-container>
</template>
