<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });
</script>

<template>
  <BaseSecure>
    <h1 class="my-6 text-center" :lang="locale">
      {{ $t('trans.history.submissnHistory') }}
    </h1>
  </BaseSecure>
</template>
