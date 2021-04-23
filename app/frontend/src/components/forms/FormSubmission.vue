<template>
  <div>
    <div v-if="loading">
      <v-skeleton-loader type="article" />
    </div>
    <div v-else>
      <v-row no-gutters>
        <v-col cols="12" sm="6">
          <h1>{{ form.name }}</h1>
          <p>
            <strong>Submitted: </strong>
            {{ formSubmission.createdAt | formatDateLong }} <br />
            <strong>Confirmation ID: </strong>
            {{ formSubmission.confirmationId }}
            <br />
            <strong>Submitted By: </strong> {{ formSubmission.createdBy }}
            <br />
          </p>
        </v-col>
        <v-spacer />
        <v-col class="text-sm-right" cols="12" sm="6">
          <DeleteSubmission :submissionId="submissionId" />
        </v-col>
      </v-row>
    </div>

    <v-row>
      <!-- The form submission -->
      <v-col
        cols="12"
        :md="form.enableStatusUpdates ? 8 : 12"
        class="pl-0 pt-0"
      >
        <v-card outlined class="review-form">
          <h2 class="review-heading">Submission</h2>
          <FormViewer :displayTitle="false" :submissionId="submissionId" />
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
        <v-card outlined class="review-form">
          <h2 class="review-heading">Status</h2>
          <StatusPanel
            :submissionId="submissionId"
            :formId="form.id"
            v-on:note-updated="refreshNotes"
          />
        </v-card>
        <v-card outlined class="review-form">
          <h2 class="review-heading">Notes</h2>
          <NotesPanel :submissionId="submissionId" ref="notesPanel" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import DeleteSubmission from '@/components/forms/submission/DeleteSubmission.vue';
import FormViewer from '@/components/designer/FormViewer.vue';
import NotesPanel from '@/components/forms/submission/NotesPanel.vue';
import StatusPanel from '@/components/forms/submission/StatusPanel.vue';

export default {
  name: 'FormSubmission',
  components: {
    DeleteSubmission,
    FormViewer,
    NotesPanel,
    StatusPanel,
  },
  props: {
    submissionId: String,
  },
  data() {
    return {
      loading: true,
    };
  },
  computed: mapGetters('form', ['form', 'formSubmission']),
  methods: {
    ...mapActions('form', ['fetchSubmission']),
    refreshNotes() {
      this.$refs.notesPanel.getNotes();
    },
  },
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
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
