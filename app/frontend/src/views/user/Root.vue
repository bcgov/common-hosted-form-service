<template>
  <BaseSecure>
    <router-link :to="{ name: 'UserForms' }">
      <v-btn color="primary" class="mr-2">
        <span>MY FORMS</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn color="primary" class="mr-2">
        <span>HISTORY</span>
      </v-btn>
    </router-link>
    <h1 class="text-center">User</h1>
  </BaseSecure>
</template>

<script>
export default {
  name: 'User',
};
</script>
