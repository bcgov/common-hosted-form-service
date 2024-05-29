<script setup>
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';

const { lang } = storeToRefs(useFormStore());
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
        <span :lang="lang">{{ $t('trans.user.root.myForms') }}</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn
        color="primary"
        class="mr-2"
        data-test="history-btn"
        :title="$t('trans.user.root.history')"
      >
        <span :lang="lang">{{ $t('trans.user.root.history') }}</span>
      </v-btn>
    </router-link>
    <h1 class="text-center" :lang="lang">
      {{ $t('trans.user.root.user') }}
    </h1>
  </BaseSecure>
</template>
