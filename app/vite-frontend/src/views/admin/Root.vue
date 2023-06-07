<script setup>
import AdminPage from '~/components/admin/AdminPage.vue';
</script>

<template>
  <v-container>
    <h1 class="mt-6">{{ $t('trans.root.admin') }}</h1>

    <AdminPage />
  </v-container>
</template>
