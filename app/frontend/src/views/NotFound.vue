<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6" :lang="locale">{{ $t('trans.notFound.pageNotFound') }}</h1>
    <router-link :to="{ name: 'About' }">
      <v-btn color="primary" size="large" :title="$t('trans.notFound.about')">
        <v-icon start icon="mdi-home"></v-icon>
        <span :lang="locale">{{ $t('trans.notFound.about') }}</span>
      </v-btn>
    </router-link>
  </v-container>
</template>
