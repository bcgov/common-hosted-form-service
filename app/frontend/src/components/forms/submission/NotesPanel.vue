<template>
  <div>
    <br>
    <ul>
      <li><strong>January 20 2021, 10:22:33 am - loneil</strong><br>This submission was reviewed and is appropriate to mark completed</li> <br>
      <li><strong>January 10 2021, 11:10:35 am - loneil</strong><br>Adding a note to this submission - Lucas</li>
    </ul>
  </div>
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
