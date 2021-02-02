<template>
  <div>
    <div v-if="loading">
      <v-skeleton-loader type="article" />
    </div>
    <div v-else>
      <h1>{{ form.name }}</h1>
      <p>
        <strong>Submitted: </strong>
        {{ formSubmission.createdAt | formatDateLong }} <br />
        <strong>Confirmation ID: </strong> {{ formSubmission.confirmationId }}
        <br />
        <strong>Submitted By: </strong> {{ formSubmission.createdBy }} <br />
      </p>
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
          <FormViewer
            :displayTitle="false"
            :formId="formId"
            :versionId="versionId"
            :submissionId="submissionId"
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
        <v-card outlined class="review-form">
          <h2 class="review-heading">Status</h2>
          <StatusPanel :submissionId="submissionId" />
        </v-card>
        <v-card outlined class="review-form">
          <h2 class="review-heading">Notes</h2>
          <NotesPanel :submissionId="submissionId" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormViewer from '@/components/designer/FormViewer.vue';
import StatusPanel from '@/components/forms/submission/StatusPanel.vue';
import NotesPanel from '@/components/forms/submission/NotesPanel.vue';

export default {
  name: 'FormSubmission',
  components: {
    FormViewer,
    NotesPanel,
    StatusPanel,
  },
  props: {
    formId: String,
    submissionId: String,
    versionId: String,
  },
  data() {
    return {
      loading: true,
    };
  },
  computed: mapGetters('form', ['form', 'formSubmission']),
  methods: mapActions('form', ['fetchSubmission']),
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    this.loading = false;
  },
};
</script>

<style lang="scss" scoped>
.review-form {
  font-size: smaller;
  margin-bottom: 2em;
  padding: 1em;
  background-color: #fafafa;
  .review-heading {
    color: #003366;
  }
}
</style>
