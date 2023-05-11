<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          color="red"
          :disabled="disabled"
          icon
          v-bind="props"
          @click="showDeleteDialog = true"
        >
          <v-icon>delete</v-icon>
        </v-btn>
      </template>
      <span>Delete This {{ isDraft ? 'Draft' : 'Submission' }}</span>
    </v-tooltip>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="delSub"
    >
      <template #title>Confirm Deletion</template>
      <template #text>
        Are you sure you wish to delete this
        {{ isDraft ? 'draft' : 'form submission' }}?
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
    disabled: {
      type: Boolean,
      default: false,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    submissionId: {
      type: String,
      required: true,
    },
  },
  emits: ['deleted'],
  data() {
    return {
      showDeleteDialog: false,
    };
  },
  computed: mapGetters('form', ['form']),
  methods: {
    ...mapActions('form', ['deleteSubmission']),
    async delSub() {
      await this.deleteSubmission(this.submissionId);
      this.showDeleteDialog = false;
      this.$emit('deleted');
    },
  },
};
</script>
