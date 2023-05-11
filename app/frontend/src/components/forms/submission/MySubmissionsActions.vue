<template>
  <span>
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
          <v-btn color="primary" :disabled="!hasViewPerm()" icon v-bind="props">
            <v-icon>remove_red_eye</v-icon>
          </v-btn>
        </template>
        <span>View This Submission</span>
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
              :disabled="!hasViewPerm()"
              icon
              v-bind="props"
            >
              <v-icon>app_registration</v-icon>
            </v-btn>
          </template>
          <span>Copy This Submission</span>
        </v-tooltip>
      </router-link>
    </span>

    <span
      v-if="submission.status === 'DRAFT' || submission.status === 'REVISING'"
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
              :disabled="!hasEditPerm()"
              icon
              v-bind="props"
            >
              <v-icon>mode_edit</v-icon>
            </v-btn>
          </template>
          <span>Edit This Draft</span>
        </v-tooltip>
      </router-link>
      <DeleteSubmission
        v-if="submission.status !== 'REVISING'"
        :disabled="!hasDeletePerm()"
        is-draft
        :submission-id="submission.submissionId"
        @deleted="draftDeleted"
      />
    </span>
  </span>
</template>

<script>
import { mapGetters } from 'vuex';
import DeleteSubmission from '@src/components/forms/submission/DeleteSubmission.vue';
import { FormPermissions } from '@src/utils/constants';

export default {
  name: 'MySubmissionsActions',
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
    ...mapGetters('form', ['form']),
    isCopyFromExistingSubmissionEnabled() {
      return this.form && this.form.enableCopyExistingSubmission;
    },
  },
  methods: {
    draftDeleted() {
      this.$emit('draft-deleted');
    },
    hasDeletePerm() {
      // Only the creator of the draft can delete it
      return this.submission.permissions.includes(
        FormPermissions.SUBMISSION_CREATE
      );
    },
    hasEditPerm() {
      return this.submission.permissions.includes(
        FormPermissions.SUBMISSION_UPDATE
      );
    },
    hasViewPerm() {
      return this.submission.permissions.includes(
        FormPermissions.SUBMISSION_READ
      );
    },
  },
};
</script>
