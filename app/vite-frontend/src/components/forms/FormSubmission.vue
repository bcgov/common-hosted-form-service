<script setup>
import { computed, onMounted, ref } from 'vue';

import AuditHistory from '~/components/forms/submission/AuditHistory.vue';
import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import FormViewer from '~/components/designer/FormViewer.vue';
import NotesPanel from '~/components/forms/submission/NotesPanel.vue';
import StatusPanel from '~/components/forms/submission/StatusPanel.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import getRouter from '~/router';
import { useFormStore } from '~/store/form';
import { NotificationTypes } from '~/utils/constants';
import { storeToRefs } from 'pinia';

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

const formStore = useFormStore();
const router = getRouter();

const { form, formSubmission } = storeToRefs(formStore);

const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);

function onDelete() {
  router.push({
    name: 'FormSubmissions',
    query: {
      f: form.value.id,
    },
  });
}

function refreshNotes() {
  notesPanel.value.getNotes();
}

function setDraft(status) {
  isDraft.value = status === 'REVISING';
}

function toggleSubmissionEdit(editing) {
  submissionReadOnly.value = !editing;
  reRenderSubmission.value += 1;
}

onMounted(async () => {
  await formStore.fetchSubmission({ submissionId: properties.submissionId });
  // get current user's permissions on associated form
  await formStore.getFormPermissionsForUser(form.value.id);
  loading.value = false;
});
</script>

<template>
  <div class="mt-5">
    <v-skeleton-loader v-if="loading" type="article" />
    <div v-else>
      <v-row class="mt-6" no-gutters>
        <!-- page title -->
        <v-col cols="12" sm="6" order="2" order-sm="1">
          <h1>{{ form.name }}</h1>
          <p>
            <strong>{{ $t('trans.formSubmission.submitted') }}</strong>
            {{ $filters.formatDateLong(formSubmission.createdAt) }}
            <br />
            <strong>{{ $t('trans.formSubmission.confirmationID') }}</strong>
            {{ formSubmission.confirmationId }}
            <br />
            <strong>{{ $t('trans.formSubmission.submittedBy') }}</strong>
            {{ formSubmission.createdBy }}
            <br />
          </p>
        </v-col>
        <!-- buttons -->
        <v-col
          class="text-right d-print-none"
          cols="12"
          sm="6"
          order="1"
          order-sm="2"
        >
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
                    icon
                    size="small"
                    v-bind="props"
                  >
                    <v-icon icon="mdi:mdi-list-box-outline"></v-icon>
                  </v-btn>
                </router-link>
              </template>
              <span>{{ $t('trans.formSubmission.viewAllSubmissions') }}</span>
            </v-tooltip>
          </span>
          <DeleteSubmission :submission-id="submissionId" @deleted="onDelete" />
        </v-col>
      </v-row>
    </div>
    <br />
    <v-row>
      <!-- The form submission -->
      <v-col
        cols="12"
        :md="form.enableStatusUpdates ? 8 : 12"
        class="pl-0 pt-0"
      >
        <v-alert
          :value="!submissionReadOnly"
          :class="'d-print-none ' + NOTIFICATIONS_TYPES.INFO.class"
          :icon="NOTIFICATIONS_TYPES.INFO.icon"
          >{{ $t('trans.formSubmission.alertInfo') }}</v-alert
        >
        <v-card variant="outlined" class="review-form">
          <v-row no-gutters>
            <v-col cols="12" sm="6">
              <h2 class="review-heading">
                {{ $t('trans.formSubmission.submission') }}
              </h2>
            </v-col>
            <v-spacer />
            <v-col
              v-if="form.enableStatusUpdates"
              class="text-sm-right d-print-none"
              cols="12"
              sm="6"
            >
              <span v-if="submissionReadOnly">
                <AuditHistory :submission-id="submissionId" />
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      class="mx-1"
                      color="primary"
                      :disabled="isDraft"
                      icon
                      size="small"
                      v-bind="props"
                      @click="toggleSubmissionEdit(true)"
                    >
                      <v-icon icon="mdi:mdi-pencil"></v-icon>
                    </v-btn>
                  </template>
                  <span>{{
                    $t('trans.formSubmission.editThisSubmission')
                  }}</span>
                </v-tooltip>
              </span>
              <v-btn
                v-else
                variant="outlined"
                color="textLink"
                @click="toggleSubmissionEdit(false)"
              >
                <span>{{ $t('trans.formSubmission.cancel') }}</span>
              </v-btn>
            </v-col>
          </v-row>
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

      <!-- Status updates and notes -->
      <v-col
        v-if="form.enableStatusUpdates"
        cols="12"
        md="4"
        class="pl-0 pt-0 d-print-none"
        order="first"
        order-md="last"
      >
        <v-card
          variant="outlined"
          class="review-form"
          :disabled="!submissionReadOnly"
        >
          <h2 class="review-heading">
            {{ $t('trans.formSubmission.status') }}
          </h2>
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
