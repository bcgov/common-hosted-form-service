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
      @continue-dialog="delSub"
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
import { mapActions, mapGetters } from 'vuex';

export default {
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showDeleteDialog: false,
    };
  },
  computed: mapGetters('form', ['form']),
  methods: {
    ...mapActions('form', ['deleteSubmission']),
    ...mapActions('notifications', ['addNotification']),
    async delSub() {
      await this.deleteSubmission(this.submissionId);
      this.showDeleteDialog = false;
      this.$router.push({
        name: 'FormSubmissions',
        query: {
          f: this.form.id,
        },
      });
    },
  },
};
</script>
