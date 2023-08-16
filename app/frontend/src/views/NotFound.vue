<template>
  <v-container class="text-center">
    <h1 class="my-6" :lang="lang">{{ $t('trans.notFound.pageNotFound') }}</h1>
    <router-link :to="{ name: 'About' }">
      <v-btn color="primary" large>
        <v-icon left>home</v-icon>
        <span :lang="lang">{{ $t('trans.notFound.about') }}</span>
      </v-btn>
    </router-link>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'NotFound',

  computed: {
    ...mapGetters('form', ['lang']),
  },
};
</script>
