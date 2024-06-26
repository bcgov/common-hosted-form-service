<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import AdministerUser from '~/components/admin/AdministerUser.vue';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

defineProps({
  u: {
    type: String,
    required: true,
  },
});

const { isRTL } = storeToRefs(useFormStore());
</script>

<template>
  <v-container>
    <h1 class="mt-6" :class="{ 'dir-rtl': isRTL }" :lang="locale">
      {{ $t('trans.admin.user.administerUser') }}
    </h1>

    <AdministerUser :user-id="u" />
  </v-container>
</template>
