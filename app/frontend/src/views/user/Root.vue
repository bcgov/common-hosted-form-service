<template>
  <BaseSecure>
    <router-link :to="{ name: 'UserForms' }">
      <v-btn color="primary" class="mr-2">
        <span :lang="multiLanguage">{{ $t('trans.user.root.myForms') }}</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn color="primary" class="mr-2">
        <span :lang="multiLanguage">{{ $t('trans.user.root.history') }}</span>
      </v-btn>
    </router-link>
    <h1 class="text-center" :lang="multiLanguage">
      {{ $t('trans.user.root.user') }}
    </h1>
  </BaseSecure>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'User',
  computed: {
    ...mapGetters('form', ['multiLanguage']),
  },
};
</script>
