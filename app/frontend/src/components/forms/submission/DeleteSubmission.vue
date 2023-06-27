<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          @click="showDeleteDialog = true"
          color="red"
          :disabled="disabled"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>delete</v-icon>
        </v-btn>
      </template>
      <span
        >{{ $t('trans.deleteSubmission.deleteThis') }}
        {{
          isDraft
            ? $t('trans.deleteSubmission.drafts')
            : $t('trans.deleteSubmission.submission')
        }}</span
      >
    </v-tooltip>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="delSub"
    >
      <template #title>{{
        $t('trans.deleteSubmission.confirmDeletion')
      }}</template>
      <template #text>
        {{ $t('trans.deleteSubmission.deleteWarning') }}
        {{
          isDraft
            ? "$t('trans.deleteSubmission.drafts')"
            : "$t('trans.deleteSubmission.formSubmission')"
        }}?
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.deleteSubmission.delete') }}</span>
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
