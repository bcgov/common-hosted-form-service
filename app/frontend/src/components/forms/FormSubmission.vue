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
            {{ formSubmission.createdAt | formatDateLong }}
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
            <PrintOptions :submissionId="submissionId" />
          </span>
          <span>
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <router-link
                  :to="{ name: 'FormSubmissions', query: { f: form.id } }"
                >
                  <v-btn
                    class="mx-1"
                    color="primary"
                    icon
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon>list_alt</v-icon>
                  </v-btn>
                </router-link>
              </template>
              <span>{{ $t('trans.formSubmission.viewAllSubmissions') }}</span>
            </v-tooltip>
          </span>
          <DeleteSubmission @deleted="onDelete" :submissionId="submissionId" />
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
          transition="scale-transition"
          >{{ $t('trans.formSubmission.alertInfo') }}</v-alert
        >
        <v-card outlined class="review-form">
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
                <AuditHistory :submissionId="submissionId" />
                <v-tooltip bottom>
                  <template #activator="{ on, attrs }">
                    <v-btn
                      class="mx-1"
                      @click="toggleSubmissionEdit(true)"
                      color="primary"
                      :disabled="isDraft"
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mode_edit</v-icon>
                    </v-btn>
                  </template>
                  <span>{{
                    $t('trans.formSubmission.editThisSubmission')
                  }}</span>
                </v-tooltip>
              </span>
              <v-btn
                v-else
                outlined
                color="textLink"
                @click="toggleSubmissionEdit(false)"
              >
                <span>{{ $t('trans.formSubmission.cancel') }}</span>
              </v-btn>
            </v-col>
          </v-row>
          <FormViewer
            :displayTitle="false"
            :key="reRenderSubmission"
            :readOnly="submissionReadOnly"
            :staffEditMode="true"
            :submissionId="submissionId"
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
        <v-card outlined class="review-form" :disabled="!submissionReadOnly">
          <h2 class="review-heading">
            {{ $t('trans.formSubmission.status') }}
          </h2>
          <StatusPanel
            :submissionId="submissionId"
            :formId="form.id"
            @note-updated="refreshNotes"
            @draft-enabled="setDraft"
          />
        </v-card>
        <v-card outlined class="review-form" :disabled="!submissionReadOnly">
          <NotesPanel :submissionId="submissionId" ref="notesPanel" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import AuditHistory from '@/components/forms/submission/AuditHistory.vue';
import DeleteSubmission from '@/components/forms/submission/DeleteSubmission.vue';
import FormViewer from '@/components/designer/FormViewer.vue';
import NotesPanel from '@/components/forms/submission/NotesPanel.vue';
import StatusPanel from '@/components/forms/submission/StatusPanel.vue';
import PrintOptions from '@/components/forms/PrintOptions.vue';
import { NotificationTypes } from '@/utils/constants';

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
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    // get current user's permissions on associated form
    await this.getFormPermissionsForUser(this.form.id);
    this.loading = false;
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
