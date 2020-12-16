<template>
  <v-container>
    <h1 class="mt-6">Administer User</h1>
    {{ u }}
  </v-container>
</template>

<script>
export default {
  name: 'AdminUserView',
  props: {
    u: String,
  },
};
</script>
