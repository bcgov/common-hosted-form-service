<template>
  <v-container>
    <h1 class="mt-6">Admin</h1>
    <AdminPage />
  </v-container>
</template>

<script>
import AdminPage from '@src/components/admin/AdminPage.vue';

export default {
  name: 'AdminRoot',
  components: {
    AdminPage,
  },
};
</script>
