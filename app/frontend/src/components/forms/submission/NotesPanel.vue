<template>
  <div>Notes</div>
</template>

<script>
export default {
  name: 'NotesPanel',
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      historyDialog: false,
    };
  },
};
</script>
