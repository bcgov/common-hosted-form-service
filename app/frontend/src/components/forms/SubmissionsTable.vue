<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <v-col cols="12" sm="6">
        <h1>Submissions</h1>
      </v-col>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="6">
        <span v-if="checkFormManage">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>settings</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Manage Form</span>
          </v-tooltip>
        </span>

        <ExportSubmissions />
      </v-col>
    </v-row>

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
    >
      <template #[`item.date`]="{ item }">
        {{ item.date | formatDateLong }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ item.status }}
      </template>
      <template #[`item.actions`]="{ item }">
        <router-link
          :to="{
            name: 'FormView',
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
import { FormManagePermissions } from '@/utils/constants';

import ExportSubmissions from '@/components/forms/ExportSubmissions.vue';

export default {
  name: 'SubmissionsTable',
  components: {
    ExportSubmissions,
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
    headers() {
      let headers = [
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
      ];
      if (this.showStatus) {
        headers.splice(3, 0, {
          text: 'Status',
          align: 'start',
          value: 'status',
        });
      }
      return headers;
    },
    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
  },
  methods: {
    ...mapActions('form', [
      'fetchForm',
      'fetchSubmissions',
      'getFormPermissionsForUser',
    ]),

    checkFormManage() {
      return this.permissions.some((p) => FormManagePermissions.includes(p));
    },

    async populateSubmissionsTable() {
      try {
        // Get the submissions for this form
        await this.fetchSubmissions({ formId: this.formId });
        // Build up the list of forms for the table
        if (this.submissionList) {
          const tableRows = this.submissionList.map((s) => {
            return {
              confirmationId: s.confirmationId,
              date: s.createdAt,
              formId: s.formId,
              status: s.formSubmissionStatusCode,
              submissionId: s.submissionId,
              submitter: s.createdBy,
              versionId: s.formVersionId,
            };
          });
          this.submissionTable = tableRows;
        }
      } catch (error) {
        // Handled in state fetchSubmissions
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.fetchForm(this.formId);
    // Get the permissions for this form
    this.getFormPermissionsForUser(this.formId);
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
