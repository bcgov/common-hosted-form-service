<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import AdminPage from '~/components/admin/AdminPage.vue';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const { isRTL } = storeToRefs(useFormStore());
</script>

<template>
  <v-container>
    <h1 class="mt-6" :class="{ 'dir-rtl': isRTL }" :lang="locale">
      {{ $t('trans.admin.root.admin') }}
    </h1>

    <AdminPage />
  </v-container>
</template>
