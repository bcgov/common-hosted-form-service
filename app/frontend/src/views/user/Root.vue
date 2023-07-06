<script>
import BaseSecure from '~/components/base/BaseSecure.vue';

export default {
  components: {
    BaseSecure,
  },
};
</script>

<template>
  <BaseSecure>
    <router-link :to="{ name: 'UserForms' }">
      <v-btn color="primary" class="mr-2" data-test="my-forms-btn">
        <span>MY FORMS</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn color="primary" class="mr-2" data-test="history-btn">
        <span>HISTORY</span>
      </v-btn>
    </router-link>
    <h1 class="text-center">User</h1>
  </BaseSecure>
</template>
