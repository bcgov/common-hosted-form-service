<script>
export default {
  methods: {
    printSubmission() {
      window.print();
    },
  },
};
</script>

<template>
  <!-- Cannot wrap this button in a tooltip as it breaks print view -->
  <v-btn
    data-test="print-btn"
    class="mx-1 d-print-none"
    color="primary"
    icon
    @click="printSubmission"
  >
    <v-icon icon="mdi:mdi-printer"></v-icon>
  </v-btn>
</template>
