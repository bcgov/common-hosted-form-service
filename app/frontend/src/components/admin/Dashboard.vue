<template>
  <v-container>
    <iframe :src="url" width="100%" height="600px"></iframe>
  </v-container>
</template>

<script>
export default {
  name: 'Dashboard',
  props: {
    url: {
      type: String,
    },
  },
};
</script>
