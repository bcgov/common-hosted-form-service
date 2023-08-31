<script>
import { mapActions, mapState } from 'pinia';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseDialog,
  },
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
  computed: {
    ...mapState(useFormStore, ['form', 'lang', 'isRTL']),
  },
  methods: {
    ...mapActions(useFormStore, ['deleteSubmission']),
    async delSub() {
      await this.deleteSubmission(this.submissionId);
      this.showDeleteDialog = false;
      this.$emit('deleted');
    },
  },
};
</script>

<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="red"
          :disabled="disabled"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-delete"
          @click="showDeleteDialog = true"
        />
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
