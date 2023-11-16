<template>
  <span :class="{ 'dir-rtl': isRTL }">
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
      <span :lang="lang"
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
      <template #title>
        <span :lang="lang">{{
          $t('trans.deleteSubmission.confirmDeletion')
        }}</span></template
      >
      <template #text>
        <span :lang="lang">
          {{ $t('trans.deleteSubmission.deleteWarning') }}
          {{
            isDraft
              ? $t('trans.deleteSubmission.drafts')
              : $t('trans.deleteSubmission.formSubmission')
          }}?</span
        >
      </template>
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.deleteSubmission.delete') }}</span>
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
  computed: mapGetters('form', ['form', 'lang', 'isRTL']),
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
