<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

const { locale } = useI18n({ useScope: 'global' });

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

const emit = defineEmits(['draft-deleted']);

const { form, isRTL } = storeToRefs(useFormStore());

const hasDeletePermission = computed(() =>
  properties.submission?.permissions?.includes(
    FormPermissions.SUBMISSION_CREATE
  )
);

const hasEditPermission = computed(() =>
  properties.submission?.permissions?.includes(
    FormPermissions.SUBMISSION_UPDATE
  )
);

const hasViewPermission = computed(() =>
  properties.submission?.permissions?.includes(FormPermissions.SUBMISSION_READ)
);

const isCopyFromExistingSubmissionEnabled = computed(
  () => form.value && form.value.enableCopyExistingSubmission
);

function draftDeleted() {
  emit('draft-deleted');
}

defineExpose({
  draftDeleted,
  hasDeletePermission,
  hasEditPermission,
  hasViewPermission,
  isCopyFromExistingSubmissionEnabled,
});
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
            :title="$t('trans.mySubmissionsActions.viewThisSubmission')"
          />
        </template>
        <span :lang="locale">{{
          $t('trans.mySubmissionsActions.viewThisSubmission')
        }}</span>
      </v-tooltip>
    </router-link>

    <span
      v-if="
        (submission.status === 'SUBMITTED' ||
          submission.status === 'COMPLETED') &&
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
              :title="$t('trans.mySubmissionsActions.copyThisSubmission')"
            />
          </template>
          <span :lang="locale">{{
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
              :title="$t('trans.mySubmissionsActions.editThisDraft')"
            />
          </template>
          <span :lang="locale">{{
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
