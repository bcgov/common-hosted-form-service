<script>
import { mapState } from 'pinia';
import BaseSecure from '~/components/base/BaseSecure.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseSecure,
  },
  computed: {
    ...mapState(useFormStore, ['lang']),
  },
};
</script>

<template>
  <BaseSecure>
    <router-link :to="{ name: 'UserForms' }">
      <v-btn color="primary" class="mr-2" data-test="my-forms-btn">
        <span :lang="lang">{{ $t('trans.user.root.myForms') }}</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn color="primary" class="mr-2" data-test="history-btn">
        <span :lang="lang">{{ $t('trans.user.root.history') }}</span>
      </v-btn>
    </router-link>
    <h1 class="text-center" :lang="lang">
      {{ $t('trans.user.root.user') }}
    </h1>
  </BaseSecure>
</template>
