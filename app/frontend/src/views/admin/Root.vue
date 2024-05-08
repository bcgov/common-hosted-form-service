<script setup>
import { storeToRefs } from 'pinia';
import AdminPage from '~/components/admin/AdminPage.vue';
import { useFormStore } from '~/store/form';

const { isRTL, lang } = storeToRefs(useFormStore());
</script>

<template>
  <v-container>
    <h1 class="mt-6" :class="{ 'dir-rtl': isRTL }" :lang="lang">
      {{ $t('trans.admin.root.admin') }}
    </h1>

    <AdminPage />
  </v-container>
</template>
