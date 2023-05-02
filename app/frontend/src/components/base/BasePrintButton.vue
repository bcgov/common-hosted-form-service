<template>
  <!-- Cannot wrap this button in a tooltip as it breaks print view -->
  <v-btn
    class="mx-1 d-print-none"
    color="primary"
    icon
    @click="printSubmission"
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
