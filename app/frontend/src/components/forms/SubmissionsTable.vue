<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Submissions</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <span v-if="checkFormManage">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                @click="showColumnsDialog = true"
                class="mx-1"
                color="primary"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>view_column</v-icon>
              </v-btn>
            </template>
            <span>Select Columns</span>
          </v-tooltip>
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
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{ name: 'SubmissionsExport', query: { f: formId } }"
              >
                <v-btn
                  class="mx-1"
                  color="primary"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>get_app</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Export Submissions to Files</span>
          </v-tooltip>
        </span>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="4" sm="4">
        <v-checkbox
          class="pl-3"
          v-model="deletedOnly"
          label="Show deleted submissions"
          @click="refreshSubmissions"
        />
      </v-col>
      <v-col cols="4" sm="4">
        <v-checkbox
          class="pl-3"
          v-model="currentUserOnly"
          label="Show my submissions"
          @click="refreshSubmissions"
        />
      </v-col>
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
      :headers="HEADERS"
      item-key="submissionId"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      :show-select="!switchSubmissionView"
      v-model="selectedSubmissions"
      loading-text="Loading... Please wait"
      no-data-text="There are no submissions for this form"
    >
      <template v-slot:[`header.event`]>
        <span v-if="!deletedOnly">
          <v-btn
            @click="(showDeleteDialog = true), (singleSubmissionDelete = false)"
            color="red"
            :disabled="selectedSubmissions.length === 0"
            icon
          >
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon color="red" dark v-bind="attrs" v-on="on"
                  >remove_circle</v-icon
                >
              </template>
              <span>Delete selected submissions</span>
            </v-tooltip>
          </v-btn>
        </span>
        <span v-if="deletedOnly">
          <v-btn
            @click="
              (showRestoreDialog = true), (singleSubmissionRestore = false)
            "
            color="red"
            :disabled="selectedSubmissions.length === 0"
            icon
          >
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-icon color="green" dark v-bind="attrs" v-on="on"
                  >restore_from_trash</v-icon
                >
              </template>
              <span>Restore selected submissions</span>
            </v-tooltip>
          </v-btn>
        </span>
      </template>

      <template #[`item.date`]="{ item }">
        {{ item.date | formatDateLong }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ item.status }}
      </template>
      <template #[`item.lateEntry`]="{ item }">
        {{ item.lateEntry === true ? 'Yes' : 'No' }}
      </template>
      <template #[`item.actions`]="{ item }">
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
      </template>
      <template #[`item.event`]="{ item }">
        <span>
          <v-tooltip bottom v-if="!item.deleted">
            <template #activator="{ on, attrs }">
              <v-btn
                @click="
                  (showDeleteDialog = true),
                    (deleteItem = item),
                    (singleSubmissionDelete = true)
                "
                color="red"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>remove_circle</v-icon>
              </v-btn>
            </template>
            <span>Delete Submission</span>
          </v-tooltip>
        </span>
        <span v-if="item.deleted">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                @click="
                  restoreItem = item;
                  showRestoreDialog = true;
                  singleSubmissionRestore = true;
                "
                color="green"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>restore_from_trash</v-icon>
              </v-btn>
            </template>
            <span>Restore</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="delSub"
    >
      <template #title>Confirm Deletion</template>
      <template #text>
        {{ singleSubmissionDelete ? singleDeleteMessage : multiDeleteMessage }}
      </template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>
    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restoreSub"
    >
      <template #title>Confirm Restoration</template>
      <template #text>
        {{
          singleSubmissionRestore ? singleRestoreMessage : multiRestoreMessage
        }}
      </template>
      <template #button-text-continue>
        <span>Restore</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        inputFilterPlaceholder="Search submission fields"
        inputItemKey="value"
        inputSaveButtonText="Save"
        :inputData="FILTER_HEADERS"
        :preselectedData="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          >Search and select columns to show under your dashboard</template
        >
      </BaseFilter>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { FormManagePermissions } from '@/utils/constants';
import moment from 'moment';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faTrash);

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
      currentUserOnly: false,
      deletedOnly: false,
      filterData: [],
      filterIgnore: [
        {
          value: 'confirmationId',
        },
        {
          value: 'actions',
        },
        {
          value: 'event',
        },
      ],
      loading: true,
      restoreItem: {},
      search: '',
      showColumnsDialog: false,
      showRestoreDialog: false,
      submissionTable: [],
      submissionsCheckboxes: [],
      showDeleteDialog: false,
      selectedSubmissions: [],
      multiDeleteMessage:
        'Are you sure you wish to delete selected submissions?',
      singleDeleteMessage: 'Are you sure you wish to delete this submission?',
      multiRestoreMessage:
        'Are you sure you wish to restore these submissions?',
      singleRestoreMessage: 'Are you sure you wish to restore this submission?',
      singleSubmissionDelete: false,
      singleSubmissionRestore: false,
      deleteItem: {},
      switchSubmissionView: false,
      switchSubmissionViewMessage: 'Show Deleted submissions',
    };
  },
  computed: {
    ...mapGetters('form', [
      'form',
      'formFields',
      'permissions',
      'submissionList',
      'userFormPreferences',
      'roles',
      'deletedSubmissions',
    ]),
    ...mapGetters('auth', ['user']),

    checkFormManage() {
      return this.permissions.some((p) => FormManagePermissions.includes(p));
    },

    DEFAULT_HEADERS() {
      let headers = [
        { text: 'Confirmation ID', align: 'start', value: 'confirmationId' },
      ];

      if (this.userFormPreferences?.preferences?.columns) {
        if (this.userFormPreferences.preferences.columns.includes('date')) {
          headers = [
            ...headers,
            {
              text: 'Submission Date',
              align: 'start',
              value: 'date',
            },
          ];
        }

        if (
          this.userFormPreferences.preferences.columns.includes('submitter')
        ) {
          headers = [
            ...headers,
            {
              text: 'Submitter',
              align: 'start',
              value: 'submitter',
            },
          ];
        }

        if (this.userFormPreferences.preferences.columns.includes('status')) {
          headers = [
            ...headers,
            {
              text: 'Status',
              align: 'start',
              value: 'status',
            },
          ];
        }
      } else {
        headers = [
          ...headers,
          {
            text: 'Submission Date',
            align: 'start',
            value: 'date',
          },
          {
            text: 'Submitter',
            align: 'start',
            value: 'submitter',
          },
          {
            text: 'Status',
            align: 'start',
            value: 'status',
          },
        ];
      }

      if (this.form && this.form.schedule && this.form.schedule.enabled) {
        //push new header for late submission if Form is setup for scheduling
        headers = [
          ...headers,
          { text: 'Late Submission', align: 'start', value: 'lateEntry' },
        ];
      }

      // Add any custom columns if the user has them
      const maxHeaderLength = 25;
      this.userColumns.forEach((col) => {
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
        text: 'View',
        align: 'end',
        value: 'actions',
        filterable: false,
        sortable: false,
        width: '40px',
      });

      // Actions column at the end
      headers.push({
        text: 'event',
        align: 'end',
        value: 'event',
        filterable: false,
        sortable: false,
        width: '40px',
      });

      return headers.filter((x) => x.value !== 'updatedAt' || this.deletedOnly);
    },

    HEADERS() {
      let headers = this.DEFAULT_HEADERS;
      if (this.filterData.length > 0)
        headers = headers.filter(
          (h) =>
            this.filterData.some((fd) => fd.value === h.value) ||
            this.filterIgnore.some((ign) => ign.value === h.value)
        );
      return headers;
    },
    FILTER_HEADERS() {
      let filteredHeader = this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
      ).concat(
        this.formFields.map((ff) => {
          return { text: ff, value: ff, align: 'end' };
        })
      );

      filteredHeader = [
        {
          text: 'Submission Date',
          align: 'start',
          value: 'date',
        },
        {
          text: 'Submitter',
          align: 'start',
          value: 'submitter',
        },
        {
          text: 'Status',
          align: 'start',
          value: 'status',
        },
        ...filteredHeader,
      ];

      return filteredHeader.filter(function (item, index, inputArray) {
        return (
          inputArray.findIndex((arrayItem) => arrayItem.value === item.value) ==
          index
        );
      });
    },
    PRESELECTED_DATA() {
      let preselectedData = [];
      if (this.userFormPreferences?.preferences?.columns) {
        preselectedData = this.userFormPreferences.preferences.columns.map(
          (column) => {
            return {
              align: 'end',
              text: column,
              value: column,
            };
          }
        );
      } else {
        preselectedData = this.DEFAULT_HEADERS.filter(
          (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
        );
      }
      return preselectedData;
    },
    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
    userColumns() {
      if (
        this.userFormPreferences &&
        this.userFormPreferences.preferences &&
        this.userFormPreferences.preferences.columns
      ) {
        // Compare saved user prefs against the current form versions component names and remove any discrepancies
        return this.userFormPreferences.preferences.columns.filter(
          (x) => this.formFields.indexOf(x) !== -1
        );
      } else {
        return [];
      }
    },
    userFilter() {
      if (
        this.userFormPreferences &&
        this.userFormPreferences.preferences &&
        this.userFormPreferences.preferences.filter &&
        this.userFormPreferences.preferences.filter.length
      ) {
        // Compare saved user prefs against the current form versions component names and remove any discrepancies
        return this.userFormPreferences.preferences.filter;
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
      'restoreSubmission',
      'getFormPermissionsForUser',
      'getFormRolesForUser',
      'getFormPreferencesForCurrentUser',
      'deleteMultiSubmissions',
      'restoreMultiSubmissions',
      'deleteSubmission',
      'updateFormPreferencesForCurrentUser',
    ]),
    ...mapActions('notifications', ['addNotification']),

    async delSub() {
      this.singleSubmissionDelete
        ? this.deleteSingleSubs()
        : this.deleteMultiSubs();
    },

    async restoreSub() {
      this.singleSubmissionRestore
        ? this.restoreSingleSub()
        : this.restoreMultipleSubs();
    },
    async deleteSingleSubs() {
      this.showDeleteDialog = false;
      await this.deleteSubmission(this.deleteItem.submissionId);
      this.refreshSubmissions();
    },
    async deleteMultiSubs() {
      let submissionsIdsToDelete = this.selectedSubmissions.map(
        (submission) => submission.submissionId
      );
      this.showDeleteDialog = false;
      await this.deleteMultiSubmissions({
        submissionIds: submissionsIdsToDelete,
        formId: this.formId,
      });
      this.refreshSubmissions();
    },

    async populateSubmissionsTable() {
      try {
        this.loading = true;
        // Get user prefs for this form
        await this.getFormPreferencesForCurrentUser(this.formId);
        // Get the submissions for this form
        let criteria = {
          formId: this.formId,
          createdAt: Object.values({
            minDate:
              this.userFormPreferences &&
              this.userFormPreferences.preferences &&
              this.userFormPreferences.preferences.filter
                ? moment(
                    this.userFormPreferences.preferences.filter[0],
                    'YYYY-MM-DD hh:mm:ss'
                  )
                    .utc()
                    .format()
                : moment()
                    .subtract(50, 'years')
                    .utc()
                    .format('YYYY-MM-DD hh:mm:ss'), //Get User filter Criteria (Min Date)
            maxDate:
              this.userFormPreferences &&
              this.userFormPreferences.preferences &&
              this.userFormPreferences.preferences.filter
                ? moment(
                    this.userFormPreferences.preferences.filter[1],
                    'YYYY-MM-DD hh:mm:ss'
                  )
                    .utc()
                    .format()
                : moment().add(50, 'years').utc().format('YYYY-MM-DD hh:mm:ss'), //Get User filter Criteria (Max Date)
          }),
          deletedOnly: this.deletedOnly,
          createdBy: this.currentUserOnly
            ? `${this.user.username}@${this.user.idp}`
            : '',
        };
        await this.fetchSubmissions(criteria);
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
                deleted: s.deleted,
                lateEntry: s.lateEntry,
              };
              // Add any custom columns
              this.userColumns.forEach((col) => {
                fields[col] = s[col];
              });
              return fields;
            });
          this.submissionTable = tableRows;
          this.submissionsCheckboxes = new Array(
            this.submissionTable.length
          ).fill(false);
        }
      } catch (error) {
        // Handled in state fetchSubmissions
      } finally {
        this.loading = false;
      }
    },

    async refreshSubmissions() {
      this.loading = true;
      Promise.all([
        this.getFormRolesForUser(this.formId),
        this.getFormPermissionsForUser(this.formId),
        this.fetchForm(this.formId).then(async () => {
          if (this.form.versions?.length > 0) {
            await this.fetchFormFields({
              formId: this.formId,
              formVersionId: this.form.versions[0].id,
            });
          }
        }),
      ])
        .then(async () => {
          await this.populateSubmissionsTable();
        })
        .finally(() => {
          this.selectedSubmissions = [];
        });
    },

    async restoreSingleSub() {
      await this.restoreSubmission({
        submissionId: this.restoreItem.submissionId,
        deleted: false,
      });
      this.showRestoreDialog = false;
      this.refreshSubmissions();
    },
    async restoreMultipleSubs() {
      let submissionsIdsToRestore = this.selectedSubmissions.map(
        (submission) => submission.submissionId
      );
      this.showRestoreDialog = false;
      await this.restoreMultiSubmissions({
        submissionIds: submissionsIdsToRestore,
        formId: this.formId,
      });
      this.refreshSubmissions();
      this.selectedSubmissions = [];
    },
    async updateFilter(data) {
      this.filterData = data;
      let preferences = {
        columns: [],
      };
      data.forEach((d) => {
        if (this.formFields.includes(d.value))
          preferences.columns.push(d.value);
      });

      await this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: preferences,
      });
      this.showColumnsDialog = false;
      await this.populateSubmissionsTable();
    },
  },

  mounted() {
    this.refreshSubmissions();
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
