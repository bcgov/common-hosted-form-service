<script>
import AdminPage from '~/components/admin/AdminPage.vue';

export default {
  components: {
    AdminPage,
  },
};
</script>

<template>
  <v-container>
    <h1 class="mt-6">{{ $t('trans.root.admin') }}</h1>

    <AdminPage />
  </v-container>
</template>
