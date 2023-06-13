<script setup>
import AdministerUser from '~/components/admin/AdministerUser.vue';

defineProps({
  u: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <v-container>
    <h1 class="mt-6">Administer User</h1>

    <AdministerUser :user-id="u" />
  </v-container>
</template>
