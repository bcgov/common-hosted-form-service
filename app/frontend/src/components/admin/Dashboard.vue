<script setup>
defineProps({
  url: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <v-container>
    <iframe :src="url" width="100%" height="600px"></iframe>
  </v-container>
</template>
