<template>
  <div>
    <!-- search input -->
    <div class="submissions-search mt-6 mt-sm-0">
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        class="pb-5"
      />
    </div>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="headers"
      item-key="title"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:item.date="{ item }">{{ item.date | formatDate }}</template>
      <template v-slot:item.actions="{ item }">
        <v-btn color="textLink" text small>
          <router-link
            :to="{ name: 'FormSubmissionView', params: { formId: item.formId, versionId: item.versionId, submissionId: item.submissionId } }"
          >
            <v-icon class="mr-1">remove_red_eye</v-icon>
            <span>VIEW</span>
          </router-link>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'SubmissionsTable',
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      alertMessage: '',
      alertShow: false,
      alertType: null,
      headers: [
        { text: 'Confirmation ID', align: 'start', value: 'confirmationId' },
        { text: 'Submission Date', align: 'start', value: 'date' },
        { text: 'Submitter', align: 'start', value: 'submitter' },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ],
      submissionTable: [],
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['submissionList']),
  },
  methods: {
    ...mapActions('form', ['fetchSubmissions']),
    async populateSubmissionsTable() {
      try {
        // Get the submissions for this form
        await this.fetchSubmissions(this.formId);
        // Build up the list of forms for the table
        if (this.submissionList) {
          const tableRows = this.submissionList.map((s) => {
            return {
              confirmationId: s.confirmationId,
              date: s.createdAt,
              formId: s.formId,
              submissionId: s.submissionId,
              submitter: s.createdBy,
              versionId: s.formVersionId,
            };
          });
          this.submissionTable = tableRows;
        }
      } catch (error) {
        console.error(`Error getting submissions: ${error}`); // eslint-disable-line no-console
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.populateSubmissionsTable();
  },
};
</script>

<style scoped>
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
