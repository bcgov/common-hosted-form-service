<script setup>
import { useOnline } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ManageSubmissionUsers from '~/components/forms/submission/ManageSubmissionUsers.vue';
import SubmitterRevision from '~/components/forms/submission/SubmitterRevision.vue';
import PrintOptionsWrapper from '~/components/forms/PrintOptionsWrapper.vue';
import PendingSubmissionsModal from '~/components/forms/offline/PendingSubmissionsModal.vue';
import { offlineQueue } from '~/offline/queue';
import { FormPermissions } from '~/utils/constants';

import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const setWideLayout = inject('setWideLayout');
defineEmits([
  'save-draft',
  'switchView',
  'showdoYouWantToSaveTheDraftModal',
  'toggle-simulate-offline',
]);

const properties = defineProps({
  block: {
    type: Boolean,
    default: false,
  },
  bulkFile: {
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
  wideFormLayout: {
    type: Boolean,
    default: false,
  },
  publicForm: {
    type: Boolean,
    default: false,
  },
  offlineEnabled: {
    type: Boolean,
    default: false,
  },
  canSimulateOffline: {
    type: Boolean,
    default: false,
  },
  simulatingOffline: {
    type: Boolean,
    default: false,
  },
});

const isWideLayout = ref(properties.wideFormLayout);

const formStore = useFormStore();

const { isRTL } = storeToRefs(formStore);

// offlineActive (real or simulated) replaces right-side controls with a
// status chip. showSimulateToggle renders the green toggle when designer
// gated and online. The two are mutually exclusive.
const networkOnline = useOnline();
const networkOffline = computed(() => !networkOnline.value);
const offlineActive = computed(
  () =>
    properties.offlineEnabled &&
    (networkOffline.value || properties.simulatingOffline)
);
const showSimulateToggle = computed(
  () =>
    properties.offlineEnabled &&
    properties.canSimulateOffline &&
    !networkOffline.value
);
const queuedCount = computed(() => offlineQueue.entries.value.length);
const showPending = ref(false);

const canSaveDraft = computed(() => !properties.readOnly);
const showEditToggle = computed(
  () =>
    properties.readOnly &&
    properties.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
);
const loading = ref(false);
function toggleLoading() {
  loading.value = !loading.value;
}

function toggleWideLayout() {
  isWideLayout.value = !isWideLayout.value;
  setWideLayout(isWideLayout.value);
}
// Sync the local copy with the prop when it changes
watch(
  () => properties.wideFormLayout,
  (newValue) => {
    isWideLayout.value = newValue;
    setWideLayout(newValue);
  },
  { immediate: true }
);
</script>

<template>
  <div
    class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    :class="{ 'dir-rtl': isRTL }"
  >
    <div v-if="formId && !publicForm">
      <v-chip
        v-if="offlineActive"
        color="warning"
        variant="flat"
        :disabled="queuedCount === 0"
        data-test="offlineSubmissionsChip"
        @click="queuedCount > 0 && (showPending = true)"
      >
        <v-icon start icon="mdi:mdi-cloud-upload-outline" />
        <span :lang="locale">{{
          t('trans.offlineSubmission.pendingChip', { count: queuedCount })
        }}</span>
      </v-chip>
      <v-btn
        v-else
        color="primary"
        :loading="loading"
        variant="outlined"
        :title="$t('trans.formViewerActions.viewMyDraftOrSubmissions')"
        @click="
          toggleLoading();
          $emit('showdoYouWantToSaveTheDraftModal');
        "
      >
        <span :lang="locale">{{
          $t('trans.formViewerActions.viewMyDraftOrSubmissions')
        }}</span>
      </v-btn>
    </div>
    <div v-if="offlineActive" class="ml-auto d-flex align-center">
      <v-tooltip
        v-if="canSimulateOffline"
        location="bottom"
        :text="t('trans.offlineSubmission.clickToGoOnline')"
      >
        <template #activator="{ props: tipProps }">
          <v-chip
            color="warning"
            variant="flat"
            data-test="simulateOfflineToggle"
            v-bind="tipProps"
            @click="$emit('toggle-simulate-offline')"
          >
            <v-icon start icon="mdi:mdi-cloud-off-outline" />
            <span :lang="locale">{{
              t('trans.offlineSubmission.simulatingBadge')
            }}</span>
          </v-chip>
        </template>
      </v-tooltip>
      <v-chip
        v-else
        color="warning"
        variant="outlined"
        data-test="offlineBadge"
      >
        <v-icon start icon="mdi:mdi-cloud-off-outline" />
        <span :lang="locale">{{
          t('trans.offlineSubmission.offlineBadge')
        }}</span>
      </v-chip>
    </div>
    <div v-else class="ml-auto d-flex align-center">
      <v-tooltip
        v-if="showSimulateToggle"
        location="bottom"
        :text="t('trans.offlineSubmission.clickToSimulateOffline')"
      >
        <template #activator="{ props: tipProps }">
          <v-chip
            color="success"
            variant="outlined"
            class="mr-2"
            data-test="simulateOfflineToggle"
            v-bind="tipProps"
            @click="$emit('toggle-simulate-offline')"
          >
            <v-icon start icon="mdi:mdi-cloud-check-outline" />
            <span :lang="locale">{{
              t('trans.offlineSubmission.simulatingOnlineBadge')
            }}</span>
          </v-chip>
        </template>
      </v-tooltip>
      <!-- Bulk button -->
      <span
        v-if="allowSubmitterToUploadFile && !block && !publicForm"
        class="ml-2"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              size="x-small"
              :title="
                bulkFile
                  ? $t('trans.formViewerActions.switchSingleSubmssn')
                  : $t('trans.formViewerActions.switchMultiSubmssn')
              "
              @click="$emit('switchView')"
            >
              <v-icon icon="mdi:mdi-repeat"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{
            bulkFile
              ? $t('trans.formViewerActions.switchSingleSubmssn')
              : $t('trans.formViewerActions.switchMultiSubmssn')
          }}</span>
        </v-tooltip>
      </span>
      <!-- Submitter Revision -->
      <SubmitterRevision
        v-if="submissionId"
        :submission-id="submissionId"
        class="ml-2"
      />
      <!-- Wide layout button -->
      <span>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-if="wideFormLayout"
              class="ml-3"
              color="primary"
              v-bind="props"
              size="x-small"
              density="default"
              icon="mdi:mdi-panorama-variant-outline"
              :title="$t('trans.formViewerActions.wideLayout')"
              @click="toggleWideLayout"
            />
          </template>
          <span>{{ $t('trans.formViewerActions.wideLayout') }}</span>
        </v-tooltip>
      </span>
      <!-- Print options -->
      <span class="ml-2 d-print-none">
        <PrintOptionsWrapper
          :submission="submission"
          :submission-id="submissionId"
          :f="formId"
        />
      </span>

      <!-- Save a draft -->
      <span
        v-if="canSaveDraft && draftEnabled && !bulkFile && !publicForm"
        class="ml-2"
      >
        <v-btn color="primary" variant="outlined" @click="$emit('save-draft')">
          <span :lang="locale">{{
            $t('trans.formViewerActions.saveAsDraft')
          }}</span>
        </v-btn>
      </span>

      <!-- Go to draft edit -->
      <span
        v-if="showEditToggle && isDraft && draftEnabled && !publicForm"
        class="ml-2"
      >
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
              <v-btn
                color="primary"
                icon="mdi:mdi-pencil"
                size="x-small"
                density="default"
                v-bind="props"
                :title="$t('trans.formViewerActions.editThisDraft')"
              />
            </template>
            <span :lang="locale">{{
              $t('trans.formViewerActions.editThisDraft')
            }}</span>
          </v-tooltip>
        </router-link>
      </span>

      <!-- Manage submission users -->
      <span v-if="draftEnabled && !publicForm" class="ml-2">
        <ManageSubmissionUsers
          :is-draft="isDraft"
          :submission-id="submissionId"
          :form-id="formId"
        />
      </span>
    </div>
    <PendingSubmissionsModal v-model="showPending" />
  </div>
</template>
