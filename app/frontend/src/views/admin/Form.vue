<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import AdministerForm from '~/components/admin/AdministerForm.vue';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const { isRTL } = storeToRefs(useFormStore());
</script>

<template>
  <v-container>
    <h1 class="mt-6" :lang="locale" :class="{ 'dir-rtl': isRTL }">
      {{ $t('trans.admin.form.administerForm') }}
    </h1>

    <AdministerForm :form-id="f" />
  </v-container>
</template>
