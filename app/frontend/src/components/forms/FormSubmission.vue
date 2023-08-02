<script>
import { mapActions, mapState } from 'pinia';

import AuditHistory from '~/components/forms/submission/AuditHistory.vue';
import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import FormViewer from '~/components/designer/FormViewer.vue';
import NotesPanel from '~/components/forms/submission/NotesPanel.vue';
import StatusPanel from '~/components/forms/submission/StatusPanel.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';

import { useFormStore } from '~/store/form';
import { NotificationTypes } from '~/utils/constants';

export default {
  components: {
    AuditHistory,
    DeleteSubmission,
    FormViewer,
    NotesPanel,
    StatusPanel,
    PrintOptions,
  },
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isDraft: true,
      loading: true,
      reRenderSubmission: 0,
      submissionReadOnly: true,
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'formSubmission']),
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
  },
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    // get current user's permissions on associated form
    await this.getFormPermissionsForUser(this.form.id);
    this.loading = false;
  },
  methods: {
    ...mapActions(useFormStore, [
      'fetchSubmission',
      'getFormPermissionsForUser',
    ]),
    onDelete() {
      this.$router.push({
        name: 'FormSubmissions',
        query: {
          f: this.form.id,
        },
      });
    },
    refreshNotes() {
      this.$fefs.notesPanel.getNotes();
    },

    setDraft(status) {
      this.isDraft = status === 'REVISING';
    },

    toggleSubmissionEdit(editing) {
      this.submissionReadOnly = !editing;
      this.reRenderSubmission += 1;
    },
  },
};
</script>

<template>
  <div class="mt-5">
    <v-skeleton-loader v-if="loading" type="article" />
    <div v-else>
      <div
        class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
      >
        <!-- page title -->
        <div>
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
        </div>
        <!-- buttons -->
        <div class="d-print-none">
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
                  />
                </router-link>
              </template>
              <span>{{ $t('trans.formSubmission.viewAllSubmissions') }}</span>
            </v-tooltip>
          </span>
          <DeleteSubmission :submission-id="submissionId" @deleted="onDelete" />
        </div>
      </div>
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
        <v-card variant="outlined" class="review-form mt-5">
          <div
            class="d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow mb-3"
          >
            <div>
              <h2 class="review-heading">
                {{ $t('trans.formSubmission.submission') }}
              </h2>
            </div>

            <div v-if="form.enableStatusUpdates" class="d-print-none">
              <span v-if="submissionReadOnly">
                <AuditHistory :submission-id="submissionId" />
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      class="mx-1"
                      color="primary"
                      v-bind="props"
                      :disabled="isDraft"
                      size="x-small"
                      density="default"
                      icon="mdi:mdi-pencil"
                      @click="toggleSubmissionEdit(true)"
                    />
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
            </div>
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
