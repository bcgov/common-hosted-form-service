<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Submissions</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <ColumnPreferences @preferences-saved="populateSubmissionsTable" />

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
      no-data-text="There are no submissions for this form"
    >
      <template #[`item.date`]="{ item }">
        {{ item.date | formatDateLong }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ item.status }}
      </template>
      <template #[`item.actions`]="{ item }">
        <span>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{
                  name: 'FormView',
                  query: {
                    s: item.submissionId,
                  },
                }"
              >
                <v-btn color="primary" icon v-bind="attrs" v-on="on">
                  <v-icon>remove_red_eye</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>View Submission</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { FormManagePermissions } from '@/utils/constants';

import ColumnPreferences from '@/components/forms/ColumnPreferences.vue';
import ExportSubmissions from '@/components/forms/ExportSubmissions.vue';

export default {
  name: 'SubmissionsTable',
  components: {
    ColumnPreferences,
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
    ...mapGetters('form', [
      'form',
      'formFields',
      'permissions',
      'submissionList',
      'userFormPreferences',
    ]),
    headers() {
      let headers = [
        { text: 'Confirmation ID', align: 'start', value: 'confirmationId' },
        { text: 'Submission Date', align: 'start', value: 'date' },
        { text: 'Submitter', align: 'start', value: 'submitter' },
      ];

      // If status flow enabled add that column
      if (this.showStatus) {
        headers.splice(3, 0, {
          text: 'Status',
          align: 'start',
          value: 'status',
        });
      }

      // Add any custom columns if the user has them
      const maxHeaderLength = 25;
      this.userColumnList.forEach((col) => {
        headers.push({
          text:
            col.length > maxHeaderLength
              ? `${col.substring(0, maxHeaderLength)}...`
              : col,
          align: 'end',
          value: col,
        });
      });

      // Actions column at the end
      headers.push({
        text: 'Actions',
        align: 'end',
        value: 'actions',
        filterable: false,
        sortable: false,
      });
      return headers;
    },
    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
    userColumnList() {
      if (
        this.userFormPreferences &&
        this.userFormPreferences.preferences &&
        this.userFormPreferences.preferences.columnList
      ) {
        // Compare saved user prefs against the current form versions component names and remove any discrepancies
        return this.userFormPreferences.preferences.columnList.filter(x => this.formFields.indexOf(x) !== -1);
      } else {
        return [];
      }
    },
  },
  methods: {
    ...mapActions('form', [
      'fetchForm',
      'fetchFormFields',
      'fetchSubmissions',
      'getFormPermissionsForUser',
      'getFormPreferencesForCurrentUser',
    ]),

    checkFormManage() {
      return this.permissions.some((p) => FormManagePermissions.includes(p));
    },

    async populateSubmissionsTable() {
      try {
        this.loading = true;
        // Get user prefs for this form
        await this.getFormPreferencesForCurrentUser(this.formId);
        // Get the submissions for this form
        await this.fetchSubmissions({ formId: this.formId });
        // Build up the list of forms for the table
        if (this.submissionList) {
          const tableRows = this.submissionList
            // Filtering out all submissions that has no status. (User has not submitted)
            .filter((s) => s.formSubmissionStatusCode)
            .map((s) => {
              const fields = {
                confirmationId: s.confirmationId,
                date: s.createdAt,
                formId: s.formId,
                status: s.formSubmissionStatusCode,
                submissionId: s.submissionId,
                submitter: s.createdBy,
                versionId: s.formVersionId,
              };
              // Add any custom columns
              this.userColumnList.forEach((col) => {
                fields[col] = s[col];
              });
              return fields;
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
    // Get the form and latest form fields
    this.fetchForm(this.formId).then(() => {
      this.fetchFormFields({
        formId: this.formId,
        formVersionId: this.form.versions[0].id,
      });
    });

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
