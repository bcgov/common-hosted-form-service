<template>
  <div>
    <v-skeleton-loader :loading="loading" type="heading">
      <v-row class="mt-6" no-gutters>
        <v-col class="text-center" cols="12" sm="10" offset-sm="1">
          <h1>Previous Submissions</h1>
          <h2>{{ form.name }}</h2>
        </v-col>
        <v-col class="text-right" cols="12" sm="1">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{
                  name: 'FormSubmit',
                  query: { f: form.id },
                }"
              >
                <v-btn
                  class="mx-1"
                  color="primary"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>add_circle</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Create a New Submission</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-skeleton-loader>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            class="pb-5"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="headers"
      item-key="title"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
      no-data-text="You have no submissions"
    >
      <template #[`item.date`]="{ item }">
        {{ item.date | formatDateLong }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ getCurrentStatus(item.statusList) }}
      </template>
      <template #[`item.submittedDate`]="{ item }">
        {{ getStatusDate(item.statusList, 'SUBMITTED') | formatDateLong }}
      </template>
      <template #[`item.completedDate`]="{ item }">
        {{ getStatusDate(item.statusList, 'COMPLETED') | formatDateLong }}
      </template>
      <template #[`item.actions`]="{ item }">
        <router-link
          :to="{
            name: 'UserFormView',
            query: {
              s: item.submissionId,
            },
          }"
        >
          <v-btn color="primary" icon>
            <v-icon>remove_red_eye</v-icon>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'MySubmissionsTable',
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      submissionTable: [],
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['form', 'submissionList', 'permissions']),
    headers() {
      let headers = [
        { text: 'ConfirmationId', align: 'start', value: 'confirmationId' },
        { text: 'Submission Date', align: 'start', value: 'submittedDate' },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ];
      if (this.showStatus) {
        headers.splice(0, 0, {
          text: 'Status',
          align: 'start',
          value: 'status',
        });
        headers.splice(3, 0, {
          text: 'Completed Date',
          align: 'start',
          value: 'completedDate',
        });
      }
      return headers;
    },
    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'fetchSubmissions']),

    // Status columns in the table
    getCurrentStatus(history) {
      // Current status is most recent status (top in array, query returns in status created desc)
      return history && history[0] ? history[0].code : 'N/A';
    },
    getStatusDate(history, statusCode) {
      // Get the created date of the most recent occurence of a specified status
      if (history) {
        const submittedStatus = history.find((stat) => stat.code == statusCode);
        if (submittedStatus) return submittedStatus.createdAt;
      }
      return '';
    },

    async populateSubmissionsTable() {
      // Get the submissions for this form
      await this.fetchSubmissions({ formId: this.formId, userView: true });
      // Build up the list of forms for the table
      if (this.submissionList) {
        const tableRows = this.submissionList.map((s) => {
          return {
            confirmationId: s.confirmationId,
            statusList: s.submissionStatus,
            submissionId: s.formSubmissionId,
          };
        });
        this.submissionTable = tableRows;
      }
      this.loading = false;
    },
  },

  mounted() {
    this.fetchForm(this.formId);
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
