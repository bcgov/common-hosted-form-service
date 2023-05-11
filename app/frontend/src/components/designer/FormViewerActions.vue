<template>
  <v-row class="d-print-none">
    <v-col v-if="formId">
      <router-link :to="{ name: 'UserSubmissions', query: { f: formId } }">
        <v-btn color="primary" variant="outlined">
          <span>View All Submissions</span>
        </v-btn>
      </router-link>
    </v-col>
    <v-col v-if="draftEnabled" class="text-right">
      <!-- Save a draft -->
      <span v-if="canSaveDraft" class="ml-2">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              @click="$emit('save-draft')"
            >
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <span>Save as a Draft</span>
        </v-tooltip>
      </span>

      <!-- Go to draft edit -->
      <span v-if="showEditToggle && isDraft" class="ml-2">
        <router-link
          :to="{
            name: 'UserFormDraftEdit',
            query: {
              s: submissionId,
            },
          }"
        >
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn color="primary" icon v-bind="props">
                <v-icon>mode_edit</v-icon>
              </v-btn>
            </template>
            <span>Edit this Draft</span>
          </v-tooltip>
        </router-link>
      </span>

      <!-- Go to draft edit -->
      <span v-if="submissionId" class="ml-2">
        <ManageSubmissionUsers
          :is-draft="isDraft"
          :submission-id="submissionId"
        />
      </span>
    </v-col>
  </v-row>
</template>

<script>
import { FormPermissions } from '@src/utils/constants';
import ManageSubmissionUsers from '@src/components/forms/submission/ManageSubmissionUsers.vue';

export default {
  name: 'MySubmissionsActions',
  components: {
    ManageSubmissionUsers,
  },
  props: {
    draftEnabled: {
      type: Boolean,
      default: false,
    },
    formId: {
      type: String,
      default: undefined,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: Array,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    submissionId: {
      type: String,
      default: undefined,
    },
  },
  emits: ['save-draft'],
  computed: {
    canSaveDraft() {
      return !this.readOnly;
    },
    showEditToggle() {
      return (
        this.readOnly &&
        this.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
      );
    },
  },
};
</script>
