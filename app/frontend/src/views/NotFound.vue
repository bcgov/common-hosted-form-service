<script>
import { mapState } from 'pinia';

import { useFormStore } from '~/store/form';

export default {
  computed: {
    ...mapState(useFormStore, ['lang']),
  },
};
</script>

<template>
  <v-container class="text-center">
    <h1 class="my-6" :lang="lang">{{ $t('trans.notFound.pageNotFound') }}</h1>
    <router-link :to="{ name: 'About' }">
      <v-btn color="primary" size="large">
        <v-icon start icon="mdi-home"></v-icon>
        <span :lang="lang">{{ $t('trans.notFound.about') }}</span>
      </v-btn>
    </router-link>
  </v-container>
</template>
