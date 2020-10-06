<template>
  <v-container>
    <h1 class="my-6 text-center">Welcome to CHEFS</h1>
    <router-link :to="{ name: 'Search' }">
      <v-btn color="primary" class="mr-2">
        <span>SEARCH</span>
      </v-btn>
    </router-link>
  </v-container>
</template>

<script>
export default {
  name: 'About',
};
</script>
