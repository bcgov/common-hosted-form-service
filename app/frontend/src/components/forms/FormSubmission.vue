<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { computed, inject, onMounted, ref } from 'vue';

import AuditHistory from '~/components/forms/submission/AuditHistory.vue';
import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import FormViewer from '~/components/designer/FormViewer.vue';
import NotesPanel from '~/components/forms/submission/NotesPanel.vue';
import StatusPanel from '~/components/forms/submission/StatusPanel.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import { checkSubmissionUpdate } from '~/utils/permissionUtils';

import { useFormStore } from '~/store/form';
import { NotificationTypes } from '~/utils/constants';

const { locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const setWideLayout = inject('setWideLayout');

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
});

const isDraft = ref(true);
const loading = ref(true);
const notesPanel = ref(null);
const reRenderSubmission = ref(0);
const submissionReadOnly = ref(true);
const isWideLayout = ref(false);

const formStore = useFormStore();

const { form, formSubmission, permissions, isRTL } = storeToRefs(formStore);

const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);

onMounted(async () => {
  await formStore.fetchSubmission({ submissionId: properties.submissionId });
  // get current user's permissions on associated form
  await formStore.getFormPermissionsForUser(form.value.id);
  loading.value = false;
  // set wide layout
  isWideLayout.value = form.value.wideFormLayout;
  setWideLayout(isWideLayout.value);
});

function onDelete() {
  router.push({
    name: 'FormSubmissions',
    query: {
      f: form.value.id,
    },
  });
}

// TODO: This should be updated to an emit so we can test it
function refreshNotes() {
  notesPanel.value.getNotes();
}

function setDraft(status) {
  isDraft.value = status === 'REVISING';
}

function toggleWideLayout() {
  isWideLayout.value = !isWideLayout.value;
  setWideLayout(isWideLayout.value);
}

async function toggleSubmissionEdit(editing) {
  submissionReadOnly.value = !editing;
  reRenderSubmission.value += 1;
  await formStore.fetchSubmission({ submissionId: properties.submissionId });
}

defineExpose({
  isDraft,
  onDelete,
  refreshNotes,
  setDraft,
  submissionReadOnly,
  toggleSubmissionEdit,
});
</script>

<template>
  <div class="mt-5">
    <v-skeleton-loader
      v-if="loading"
      type="article"
      :class="{ 'dir-rtl': isRTL }"
    />
    <div v-else :class="{ 'dir-rtl': isRTL }">
      <div
        class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
      >
        <!-- page title -->
        <div>
          <h1>{{ form.name }}</h1>
          <p :lang="locale">
            <strong>{{ $t('trans.formSubmission.submitted') }}</strong>
            {{ $filters.formatDateLong(formSubmission.createdAt) }}
            <br />
            <strong>{{ $t('trans.formSubmission.confirmationID') }}</strong>
            {{ formSubmission.confirmationId }}
            <br />
            <strong>{{ $t('trans.formSubmission.submittedBy') }}</strong>
            {{ formSubmission.createdBy }}
            <br />
            <span v-if="formSubmission.updatedBy">
              <strong>{{ $t('trans.formSubmission.updatedAt') }}:</strong>
              {{ $filters.formatDateLong(formSubmission.updatedAt) }}
              <br />
              <strong>{{ $t('trans.formSubmission.updatedBy') }}:</strong>
              {{ formSubmission.updatedBy }}
            </span>
          </p>
        </div>
        <!-- buttons -->
        <div class="d-print-none">
          <span>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-if="form.wideFormLayout"
                  class="mx-1"
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

          <span>
            <PrintOptions :submission-id="submissionId" />
          </span>
          <span>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <router-link
                  :to="{ name: 'FormSubmissions', query: { f: form.id } }"
                >
                  <v-btn
                    class="mx-1"
                    color="primary"
                    v-bind="props"
                    size="x-small"
                    density="default"
                    icon="mdi:mdi-list-box-outline"
                    :title="$t('trans.formSubmission.viewAllSubmissions')"
                  />
                </router-link>
              </template>
              <span :lang="locale"
                >{{ $t('trans.formSubmission.viewAllSubmissions') }}
              </span>
            </v-tooltip>
          </span>
          <DeleteSubmission :submission-id="submissionId" @deleted="onDelete" />
        </div>
      </div>
    </div>
    <br />
    <v-row>
      <!-- Status updates and notes -->
      <v-col
        v-if="form.enableStatusUpdates"
        cols="12"
        class="pl-0 pt-0 d-print-none"
        order="first"
        order-md="last"
      >
        <v-card
          variant="outlined"
          class="review-form"
          :disabled="!submissionReadOnly"
        >
          <StatusPanel
            :submission-id="submissionId"
            :form-id="form.id"
            @note-updated="refreshNotes"
            @draft-enabled="setDraft"
          />
        </v-card>
        <v-card
          variant="outlined"
          class="review-form"
          :disabled="!submissionReadOnly"
        >
          <NotesPanel ref="notesPanel" :submission-id="submissionId" />
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <!-- The form submission -->
      <v-col cols="12" class="pl-0 pt-0">
        <transition name="scale-transition">
          <v-alert
            v-if="!submissionReadOnly"
            :class="[
              'd-print-none mb-4 ' + NOTIFICATIONS_TYPES.INFO.class,
              { 'dir-rtl': isRTL },
            ]"
            :icon="NOTIFICATIONS_TYPES.INFO.icon"
            :lang="locale"
            >{{ $t('trans.formSubmission.alertInfo') }}</v-alert
          >
        </transition>
        <v-card variant="outlined" class="review-form">
          <div :class="{ 'dir-rtl': isRTL }">
            <v-row no-gutters>
              <v-col cols="10">
                <h2 class="review-heading" :lang="locale">
                  {{ $t('trans.formSubmission.submission') }}
                </h2>
              </v-col>
              <v-spacer />
              <v-col
                v-if="form.enableStatusUpdates"
                :class="isRTL ? 'text-left' : 'text-right'"
                class="d-print-none"
                cols="2"
              >
                <span v-if="submissionReadOnly">
                  <AuditHistory :submission-id="submissionId" />
                  <v-tooltip
                    v-if="checkSubmissionUpdate(permissions)"
                    location="bottom"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        class="mx-1"
                        color="primary"
                        v-bind="props"
                        :disabled="isDraft"
                        size="x-small"
                        density="default"
                        icon="mdi:mdi-pencil"
                        :title="$t('trans.formSubmission.editThisSubmission')"
                        @click="toggleSubmissionEdit(true)"
                      />
                    </template>
                    <span :lang="locale">{{
                      $t('trans.formSubmission.editThisSubmission')
                    }}</span>
                  </v-tooltip>
                </span>
                <v-btn
                  v-else
                  variant="outlined"
                  color="textLink"
                  :title="$t('trans.formSubmission.cancel')"
                  @click="toggleSubmissionEdit(false)"
                >
                  <span :lang="locale">{{
                    $t('trans.formSubmission.cancel')
                  }}</span>
                </v-btn>
              </v-col>
            </v-row>
          </div>
          <FormViewer
            :key="reRenderSubmission"
            :display-title="false"
            :read-only="submissionReadOnly"
            :staff-edit-mode="true"
            :submission-id="submissionId"
            @submission-updated="toggleSubmissionEdit(false)"
          />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.review-form {
  margin-bottom: 2em;
  padding: 1em;
  background-color: #fafafa;
  .review-heading {
    color: #003366;
  }
}
</style>
