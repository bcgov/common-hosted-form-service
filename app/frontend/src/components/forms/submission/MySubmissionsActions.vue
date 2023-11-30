<script>
import { mapState } from 'pinia';

import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

export default {
  components: {
    DeleteSubmission,
  },
  props: {
    submission: {
      type: Object,
      required: true,
    },
    formId: {
      type: String,
      required: true,
    },
  },
  emits: ['draft-deleted'],
  computed: {
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
    isCopyFromExistingSubmissionEnabled() {
      return this.form && this.form.enableCopyExistingSubmission;
    },
    hasDeletePermission() {
      return this.submission?.permissions?.includes(
        FormPermissions.SUBMISSION_CREATE
      );
    },
    hasEditPermission() {
      return this.submission?.permissions?.includes(
        FormPermissions.SUBMISSION_UPDATE
      );
    },
    hasViewPermission() {
      return this.submission?.permissions?.includes(
        FormPermissions.SUBMISSION_READ
      );
    },
  },
  methods: {
    draftDeleted() {
      this.$emit('draft-deleted');
    },
  },
};
</script>

<template>
  <span class="d-flex">
    <router-link
      :to="{
        name: 'UserFormView',
        query: {
          s: submission.submissionId,
        },
      }"
    >
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            color="primary"
            v-bind="props"
            :disabled="!hasViewPermission"
            size="x-small"
            density="default"
            icon="mdi:mdi-eye"
          />
        </template>
        <span :lang="lang">{{
          $t('trans.mySubmissionsActions.viewThisSubmission')
        }}</span>
      </v-tooltip>
    </router-link>

    <span
      v-if="
        submission.status === 'SUBMITTED' &&
        isCopyFromExistingSubmissionEnabled === true
      "
    >
      <router-link
        :to="{
          name: 'UserFormDuplicate',
          query: {
            s: submission.submissionId,
            f: formId,
          },
        }"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              v-bind="props"
              :disabled="!hasViewPermission"
              size="x-small"
              :class="isRTL ? 'mr-1' : 'ml-1'"
              density="default"
              icon="mdi:mdi-pencil-box-multiple"
            />
          </template>
          <span :lang="lang">{{
            $t('trans.mySubmissionsActions.copyThisSubmission')
          }}</span>
        </v-tooltip>
      </router-link>
    </span>

    <span
      v-if="submission.status === 'DRAFT' || submission.status === 'REVISING'"
      class="d-flex"
    >
      <router-link
        :to="{
          name: 'UserFormDraftEdit',
          query: {
            s: submission.submissionId,
          },
        }"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              v-bind="props"
              :disabled="!hasEditPermission"
              size="x-small"
              :class="isRTL ? 'mr-1' : 'ml-1'"
              density="default"
              icon="mdi:mdi-pencil"
            />
          </template>
          <span :lang="lang">{{
            $t('trans.mySubmissionsActions.editThisDraft')
          }}</span>
        </v-tooltip>
      </router-link>
      <DeleteSubmission
        v-if="submission.status !== 'REVISING'"
        :disabled="!hasDeletePermission"
        is-draft
        :submission-id="submission.submissionId"
        icon-size="x-small"
        @deleted="draftDeleted"
      />
    </span>
  </span>
</template>
