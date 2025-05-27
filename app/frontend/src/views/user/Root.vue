<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });
</script>

<template>
  <BaseSecure>
    <v-btn
      color="primary"
      class="mr-2"
      :to="{ name: 'UserForms' }"
      data-test="my-forms-btn"
      :title="$t('trans.user.root.myForms')"
    >
      <span :lang="locale">{{ $t('trans.user.root.myForms') }}</span>
      <span :lang="locale">{{ $t('trans.user.root.myForms') }}</span>
    </v-btn>
    <v-btn
      color="primary"
      class="mr-2"
      data-test="history-btn"
      :to="{ name: 'UserHistory' }"
      :title="$t('trans.user.root.history')"
    >
      <span :lang="locale">{{ $t('trans.user.root.history') }}</span>
    </v-btn>
    <h1 class="text-center" :lang="locale">
      {{ $t('trans.user.root.user') }}
    </h1>
  </BaseSecure>
</template>
