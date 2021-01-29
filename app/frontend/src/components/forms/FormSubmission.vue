<template>
  <div>
    <div v-if="loading">Test {{ formId }}</div>
    <div v-else>
      <h1>Magic Intake Form</h1>
      <p>
        <strong>Submitted: </strong> January 21, 2020, 4:55 pm <br />
        <strong>Confirmation ID: </strong> ABC1234 <br />
        <strong>Submitted By: </strong> loneil <br />
      </p>
    </div>

    <v-row>
      <!-- The form submission -->
      <v-col cols="12" md="8" class="pl-0 pt-0">
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
  computed: mapGetters('form', ['form']),
  methods: mapActions('form', ['fetchForm']),
  async mounted() {
    await this.fetchForm(this.formId);
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
