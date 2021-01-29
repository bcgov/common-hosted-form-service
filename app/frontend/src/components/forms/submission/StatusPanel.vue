<template>
  <div>StatusHere</div>
</template>

<script>
export default {
  name: 'StatusPanel',
  props: {
    submissionId: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      historyDialog: false,
    };
  },
};
</script>
