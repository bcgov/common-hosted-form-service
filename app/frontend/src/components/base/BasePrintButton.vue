<template>
  <!-- Cannot wrap this button in a tooltip as it breaks print view -->
  <v-btn
    @click="printSubmission"
    class="mx-1 d-print-none"
    color="primary"
    icon
  >
    <v-icon>print</v-icon>
  </v-btn>
</template>

<script>
export default {
  name: 'BasePrintButton',
  methods: {
    printSubmission() {
      window.print();
    },
  },
};
</script>
