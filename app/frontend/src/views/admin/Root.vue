<template>
  <v-container>
    <h1 class="mt-6">{{ $t('trans.root.admin') }}</h1>

    <AdminPage />
  </v-container>
</template>

<script>
import AdminPage from '@/components/admin/AdminPage.vue';

export default {
  name: 'AdminRoot',
  components: {
    AdminPage,
  },
};
</script>
