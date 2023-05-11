<template>
  <div class="mt-5">
    <v-skeleton-loader v-if="loading" type="article" />
    <div v-else>
      <v-row class="mt-6" no-gutters>
        <!-- page title -->
        <v-col cols="12" sm="6" order="2" order-sm="1">
          <h1>{{ form.name }}</h1>
          <p>
            <strong>Submitted:</strong>
            {{ $filters.formatDateLong(formSubmission.createdAt) }}
            <br />
            <strong>Confirmation ID:</strong>
            {{ formSubmission.confirmationId }}
            <br />
            <strong>Submitted By:</strong>
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
                  <v-btn class="mx-1" color="primary" icon v-bind="props">
                    <v-icon>list_alt</v-icon>
                  </v-btn>
                </router-link>
              </template>
              <span>View All Submissions</span>
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
          v-if="!submissionReadOnly"
          :class="'d-print-none ' + NOTIFICATIONS_TYPES.INFO.class"
          :icon="NOTIFICATIONS_TYPES.INFO.icon"
          text="After editing, re-submit the form to save your changes."
        ></v-alert>
        <v-card variant="outlined" class="review-form">
          <v-row no-gutters>
            <v-col cols="12" sm="6">
              <h2 class="review-heading">Submission</h2>
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
                      v-bind="props"
                      @click="toggleSubmissionEdit(true)"
                    >
                      <v-icon>mode_edit</v-icon>
                    </v-btn>
                  </template>
                  <span>Edit This Submission</span>
                </v-tooltip>
              </span>
              <v-btn
                v-else
                variant="outlined"
                color="textLink"
                @click="toggleSubmissionEdit(false)"
              >
                <span>CANCEL</span>
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
          <h2 class="review-heading">Status</h2>
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

<script>
import { mapActions, mapGetters } from 'vuex';

import AuditHistory from '@src/components/forms/submission/AuditHistory.vue';
import DeleteSubmission from '@src/components/forms/submission/DeleteSubmission.vue';
import FormViewer from '@src/components/designer/FormViewer.vue';
import NotesPanel from '@src/components/forms/submission/NotesPanel.vue';
import StatusPanel from '@src/components/forms/submission/StatusPanel.vue';
import PrintOptions from '@src/components/forms/PrintOptions.vue';
import { NotificationTypes } from '@src/utils/constants';

export default {
  name: 'FormSubmission',
  components: {
    AuditHistory,
    DeleteSubmission,
    FormViewer,
    NotesPanel,
    PrintOptions,
    StatusPanel,
  },
  props: {
    submissionId: String,
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
    ...mapGetters('form', ['form', 'formSubmission', 'permissions']),
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
    ...mapActions('form', ['fetchSubmission', 'getFormPermissionsForUser']),
    onDelete() {
      this.$router.push({
        name: 'FormSubmissions',
        query: {
          f: this.form.id,
        },
      });
    },
    refreshNotes() {
      this.$refs.notesPanel.getNotes();
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
