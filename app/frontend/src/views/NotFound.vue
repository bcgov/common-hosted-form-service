<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6" :lang="locale">{{ $t('trans.notFound.pageNotFound') }}</h1>

    <v-btn
      color="primary"
      size="large"
      :to="{ name: 'About' }"
      :title="$t('trans.notFound.about')"
    >
      <v-icon start icon="mdi-home"></v-icon>
      <span :lang="locale">{{ $t('trans.notFound.about') }}</span>
    </v-btn>
  </v-container>
</template>
