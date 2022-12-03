<template>
  <div>
    <v-skeleton-loader :loading="loading" type="heading">
      <v-row class="mt-6" no-gutters>
        <!-- page title -->
        <v-col cols="12" sm="6" order="2" order-sm="1">
          <h1>Previous Submissions</h1>
        </v-col>
        <!-- buttons -->
        <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
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
        <!-- form name -->
        <v-col cols="12" order="3">
          <h3>{{ formId ? form.name : 'All Forms' }}</h3>
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
      <template #[`item.lastEdited`]="{ item }">
        {{ item.lastEdited | formatDateLong }}
      </template>
      <template #[`item.submittedDate`]="{ item }">
        {{ item.submittedDate | formatDateLong }}
      </template>
      <template #[`item.completedDate`]="{ item }">
        {{ item.completedDate | formatDateLong }}
      </template>
      <template #[`item.actions`]="{ item }">
        <MySubmissionsActions
          @draft-deleted="populateSubmissionsTable"
          :submission="item"
        />
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import MySubmissionsActions from '@/components/forms/submission/MySubmissionsActions.vue';

export default {
  name: 'MySubmissionsTable',
  components: {
    MySubmissionsActions,
  },
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
    ...mapGetters('auth', [
      'user'
    ]),
    headers() {
      let headers = [
        { text: 'Confirmation Id', align: 'start', value: 'confirmationId' },
        { text: 'Status', align: 'start', value: 'status' },
        {
          text: 'Submission Date',
          align: 'start',
          value: 'submittedDate',
          sortable: true,
        },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ];
      if (this.showDraftLastEdited || !this.formId) {
        headers.splice(2, 0, {
          text: 'Draft Last Edited',
          align: 'start',
          value: 'lastEdited',
          sortable: true,
        });
      }
      if (!this.formId) {
        headers.splice(0, 0, {
          text: 'Form Title',
          align: 'start',
          value: 'name',
        });
      }
      return headers;
    },
    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
    showDraftLastEdited() {
      return this.form && this.form.enableSubmitterDraft;
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'fetchSubmissions']),

    // Status columns in the table
    getCurrentStatus(record) {
      // Current status is most recent status (top in array, query returns in status created desc)
      const status = record.submissionStatus && record.submissionStatus[0]
        ? record.submissionStatus[0].code
        : 'N/A';
      if (record.draft && status !== 'REVISING') {
        return 'DRAFT';
      } else {
        return status;
      }
    },
    getStatusDate(record, statusCode) {
      // Get the created date of the most recent occurence of a specified status
      if (record.submissionStatus) {
        const submittedStatus = record.submissionStatus.find(
          (stat) => stat.code === statusCode
        );
        if (submittedStatus) return submittedStatus.createdAt;
      }
      return '';
    },

    async populateSubmissionsTable() {
      this.loading = true;
      // Get the submissions for this form
      await this.fetchSubmissions({ formId: this.formId, userView: true, createdBy: `${this.user.username}@${this.user.idp}` });
      // Build up the list of forms for the table
      if (this.submissionList) {
        const tableRows = this.submissionList.map((s) => {
          return {
            confirmationId: s.confirmationId,
            lastEdited: s.draft ? s.updatedAt : undefined,
            name: s.name,
            permissions: s.permissions,
            status: this.getCurrentStatus(s),
            submissionId: s.formSubmissionId,
            submittedDate: this.getStatusDate(s, 'SUBMITTED')
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
