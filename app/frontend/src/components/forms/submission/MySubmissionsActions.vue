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
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            color="primary"
            :disabled="!hasViewPerm()"
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>remove_red_eye</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('trans.mySubmissionsActions.viewThisSubmission') }}</span>
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
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              :disabled="!hasViewPerm()"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>app_registration</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.mySubmissionsActions.copyThisSubmission') }}</span>
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
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              :disabled="!hasEditPerm()"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mode_edit</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.mySubmissionsActions.editThisDraft') }}</span>
        </v-tooltip>
      </router-link>
      <DeleteSubmission
        v-if="submission.status !== 'REVISING'"
        @deleted="draftDeleted"
        :disabled="!hasDeletePerm()"
        isDraft
        :submissionId="submission.submissionId"
      />
    </span>
  </span>
</template>

<script>
import { mapGetters } from 'vuex';
import DeleteSubmission from '@/components/forms/submission/DeleteSubmission.vue';
import { FormPermissions } from '@/utils/constants';

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
