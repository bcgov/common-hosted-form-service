<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });
</script>

<template>
  <BaseSecure>
    <router-link :to="{ name: 'UserForms' }">
      <v-btn
        color="primary"
        class="mr-2"
        data-test="my-forms-btn"
        :title="$t('trans.user.root.myForms')"
      >
        <span :lang="locale">{{ $t('trans.user.root.myForms') }}</span>
        <span :lang="locale">{{ $t('trans.user.root.myForms') }}</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn
        color="primary"
        class="mr-2"
        data-test="history-btn"
        :title="$t('trans.user.root.history')"
      >
        <span :lang="locale">{{ $t('trans.user.root.history') }}</span>
      </v-btn>
    </router-link>
    <h1 class="text-center" :lang="locale">
      {{ $t('trans.user.root.user') }}
    </h1>
  </BaseSecure>
</template>
