<script setup>
import { computed } from 'vue';

import ManageSubmissionUsers from '~/components/forms/submission/ManageSubmissionUsers.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import { FormPermissions } from '~/utils/constants';

const properties = defineProps({
  block: {
    type: Boolean,
    default: false,
  },
  isSingleSubmission: {
    type: Boolean,
    default: false,
  },
  allowSubmitterToUploadFile: {
    type: Boolean,
    default: false,
  },
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
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  submissionId: {
    type: String,
    default: undefined,
  },
  submission: {
    type: Object,
    default: undefined,
  },
});

const emits = defineEmits([
  'save-draft',
  'toggleSubmissionView',
  'showdoYouWantToSaveTheDraftModal',
]);

const canSaveDraft = computed(() => !properties.readOnly);
const showEditToggle = computed(
  () =>
    properties.readOnly &&
    properties.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
);
</script>

<template>
  <v-row class="d-print-none">
    <v-col v-if="formId">
      <router-link :to="{ name: 'UserSubmissions', query: { f: formId } }">
        <v-btn
          color="primary"
          variant="outlined"
          @click="emits('showdoYouWantToSaveTheDraftModal')"
        >
          <span>{{ $t('trans.formViewerActions.viewAllSubmissions') }}</span>
        </v-btn>
      </router-link>
    </v-col>
    <v-col v-if="draftEnabled" class="text-right">
      <!-- Bulk button -->
      <span v-if="allowSubmitterToUploadFile && !block" class="ml-2">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              size="small"
              @click="emits('toggleSubmissionView')"
            >
              <v-icon icon="mdi:mdi-repeat"></v-icon>
            </v-btn>
          </template>
          <span>{{
            isSingleSubmission
              ? $t('trans.formViewerActions.switchSingleSubmssn')
              : $t('trans.formViewerActions.switchMultiSubmssn')
          }}</span>
        </v-tooltip>
      </span>

      <!-- Save a draft -->
      <span
        v-if="canSaveDraft && draftEnabled && isSingleSubmission"
        class="ml-2"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              size="small"
              @click="$emit('save-draft')"
            >
              <v-icon icon="mdi:mdi-content-save"></v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.formViewerActions.saveAsADraft') }}</span>
        </v-tooltip>
      </span>

      <span v-if="draftEnabled" class="ml-2">
        <PrintOptions :submission="submission" />
      </span>

      <!-- Go to draft edit -->
      <span v-if="showEditToggle && isDraft && draftEnabled" class="ml-2">
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
              <v-btn color="primary" icon size="small" v-bind="props">
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.formViewerActions.editThisDraft') }}</span>
          </v-tooltip>
        </router-link>
      </span>

      <!-- Go to draft edit -->
      <span v-if="submissionId && draftEnabled" class="ml-2">
        <ManageSubmissionUsers
          :is-draft="isDraft"
          :submission-id="submissionId"
        />
      </span>
    </v-col>
  </v-row>
</template>
