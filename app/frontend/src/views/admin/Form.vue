<template>
  <v-container>
    <h1 class="mt-6">Administer Form</h1>
    {{ f }}
  </v-container>
</template>

<script>
export default {
  name: 'AdminFormView',
  props: {
    f: String,
  },
};
</script>
