<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

const properties = defineProps({
  submission: {
    type: Object,
    required: true,
  },
  formId: {
    type: String,
    required: true,
  },
});

const emits = defineEmits(['draft-deleted']);

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

const isCopyFromExistingSubmissionEnabled = computed(
  () => form.value && form.value.enableCopyExistingSubmission
);

const hasDeletePermission = computed(() =>
  properties.submission.value.permissions.includes(
    FormPermissions.SUBMISSION_CREATE
  )
);
const hasEditPermission = computed(() =>
  properties.submission.value.permissions.includes(
    FormPermissions.SUBMISSION_UPDATE
  )
);
const hasViewPermission = computed(() =>
  properties.submission.value.permissions.includes(
    FormPermissions.SUBMISSION_READ
  )
);

function draftDeleted() {
  emits('draft-deleted');
}
</script>

<template>
  <span>
    <router-link
      :to="{
        name: 'UserFormView',
        query: {
          s: properties.submission.value.submissionId,
        },
      }"
    >
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            color="primary"
            :disabled="!hasViewPermission"
            icon
            size="x-small"
            v-bind="props"
          >
            <v-icon icon="mdi:mdi-eye"></v-icon>
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
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              :disabled="!hasViewPermission"
              icon
              size="small"
              v-bind="props"
            >
              <v-icon icon="mdi:mdi-pencil-box-multiple"></v-icon>
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
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              :disabled="!hasEditPermission"
              icon
              size="small"
              v-bind="props"
            >
              <v-icon icon="mdi:mdi-pencil"></v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.mySubmissionsActions.editThisDraft') }}</span>
        </v-tooltip>
      </router-link>
      <DeleteSubmission
        v-if="submission.status !== 'REVISING'"
        :disabled="!hasDeletePermission"
        is-draft
        :submission-id="submission.submissionId"
        @deleted="draftDeleted"
      />
    </span>
  </span>
</template>
