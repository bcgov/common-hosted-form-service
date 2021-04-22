<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          @click="showDeleteDialog = true"
          color="red"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>delete</v-icon>
        </v-btn>
      </template>
      <span>Delete This Submission</span>
    </v-tooltip>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteSubmission"
    >
      <template #title>Confirm Deletion</template>
      <template #text>
        Are you sure you wish to delete this form submission?
      </template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>
  </span>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  data() {
    return {
      showDeleteDialog: false
    };
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    deleteSubmission() {
      alert('coming soon');
    },
  },
};
</script>
