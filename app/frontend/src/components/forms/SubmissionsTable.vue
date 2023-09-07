<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-4 d-flex flex-md-row justify-space-between flex-sm-column flex-xs-column"
    >
      <!-- page title -->
      <div>
        <h1 :lang="lang">
          {{ $t('trans.submissionsTable.submissions') }}
        </h1>
      </div>
      <!-- buttons -->
      <div>
        <span v-if="checkFormManage">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                @click="onShowColumnDialog"
                class="mx-1"
                color="primary"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>view_column</v-icon>
              </v-btn>
            </template>
            <span :lang="lang">{{
              $t('trans.submissionsTable.selectColumns')
            }}</span>
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
            <span :lang="lang">{{
              $t('trans.submissionsTable.manageForm')
            }}</span>
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
            <span :lang="lang">{{
              $t('trans.submissionsTable.submissionsToFiles')
            }}</span>
          </v-tooltip>
        </span>
      </div>
    </div>

    <div
      class="d-flex flex-md-row justify-space-between flex-sm-column flex-xs-column"
    >
      <div>
        <v-checkbox
          class="pl-3"
          v-model="deletedOnly"
          @click="refreshSubmissions"
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.submissionsTable.showDeletedSubmissions') }}
            </span>
          </template>
        </v-checkbox>
      </div>
      <div>
        <v-checkbox
          class="pl-3"
          v-model="currentUserOnly"
          @click="refreshSubmissions"
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.submissionsTable.showMySubmissions') }}
            </span>
          </template>
        </v-checkbox>
      </div>
      <div>
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('trans.submissionsTable.search')"
            single-line
            hide-details
            class="pb-5"
            :class="{ label: isRTL }"
            :lang="lang"
          />
        </div>
      </div>
    </div>

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
      :loading-text="$t('trans.submissionsTable.loadingText')"
      :no-data-text="$t('trans.submissionsTable.noDataText')"
      :lang="lang"
      :server-items-length="totalSubmissions"
      @update:options="updateTableOptions"
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
              <span :lang="lang">{{
                $t('trans.submissionsTable.delSelectedSubmissions')
              }}</span>
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
              <span :lang="lang">{{
                $t('trans.submissionsTable.resSelectedSubmissions')
              }}</span>
            </v-tooltip>
          </v-btn>
        </span>
      </template>

      <template #[`item.date`]="{ item }">
        {{ item.date | formatDateLong }}
      </template>
      <template #[`item.updatedAt`]="{ item }">
        {{ item.updatedAt | formatDateLong }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ item.status }}
      </template>
      <template #[`item.lateEntry`]="{ item }">
        <span :lang="lang">
          {{
            item.lateEntry === true
              ? $t('trans.submissionsTable.yes')
              : $t('trans.submissionsTable.no')
          }}
        </span>
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
          <span :lang="lang">{{
            $t('trans.submissionsTable.viewSubmission')
          }}</span>
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
            <span :lang="lang">{{
              $t('trans.submissionsTable.deleteSubmission')
            }}</span>
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
            <span :lang="lang">{{ $t('trans.submissionsTable.restore') }}</span>
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
      <template #title>{{
        $t('trans.submissionsTable.confirmDeletion')
      }}</template>
      <template #text>
        {{ singleSubmissionDelete ? singleDeleteMessage : multiDeleteMessage }}
      </template>
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.submissionsTable.delete') }}</span>
      </template>
    </BaseDialog>
    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restoreSub"
    >
      <template #title
        ><span :lang="lang">
          {{ $t('trans.submissionsTable.confirmRestoration') }}</span
        ></template
      >
      <template #text>
        {{
          singleSubmissionRestore ? singleRestoreMessage : multiRestoreMessage
        }}
      </template>
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.submissionsTable.restore') }}</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :inputFilterPlaceholder="
          $t('trans.submissionsTable.searchSubmissionFields')
        "
        inputItemKey="value"
        :inputSaveButtonText="$t('trans.submissionsTable.save')"
        :inputData="SELECT_COLUMNS_HEADERS"
        :resetData="FILTER_HEADERS"
        :preselectedData="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
        :lang="lang"
      >
        <template #filter-title
          ><span :lang="lang">
            {{ $t('trans.submissionsTable.searchTitle') }}
          </span></template
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
      itemsPerPage: 10,
      page: 0,
      filterData: [],
      sortBy: undefined,
      sortDesc: false,
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
      tableFilterIgnore: [
        { value: 'date' },
        { value: 'submitter' },
        { value: 'status' },
        { value: 'lateEntry' },
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
      singleSubmissionDelete: false,
      singleSubmissionRestore: false,
      deleteItem: {},
      switchSubmissionView: false,
    };
  },
  computed: {
    multiDeleteMessage() {
      return this.$t('trans.submissionsTable.multiDelWarning');
    },
    singleDeleteMessage() {
      return this.$t('trans.submissionsTable.singleDelWarning');
    },
    multiRestoreMessage() {
      return this.$t('trans.submissionsTable.multiRestoreWarning');
    },
    singleRestoreMessage() {
      return this.$t('trans.submissionsTable.singleRestoreWarning');
    },
    switchSubmissionViewMessage() {
      return this.$t('trans.submissionsTable.showDeletedSubmissions');
    },
    ...mapGetters('form', [
      'form',
      'formFields',
      'permissions',
      'submissionList',
      'userFormPreferences',
      'roles',
      'deletedSubmissions',
      'isRTL',
      'lang',
      'totalSubmissions',
    ]),
    ...mapGetters('auth', ['user']),
    checkFormManage() {
      return this.permissions.some((p) => FormManagePermissions.includes(p));
    },
    DEFAULT_HEADER() {
      let headers = [
        {
          text: this.$t('trans.submissionsTable.confirmationID'),
          align: 'start',
          value: 'confirmationId',
        },

        {
          text: this.$t('trans.submissionsTable.submissionDate'),
          align: 'start',
          value: 'date',
        },

        {
          text: this.$t('trans.submissionsTable.submitter'),
          align: 'start',
          value: 'submitter',
        },

        {
          text: this.$t('trans.submissionsTable.status'),
          align: 'start',
          value: 'status',
        },
      ];

      if (this.form && this.form.schedule && this.form.schedule.enabled) {
        //push new header for late submission if Form is setup for scheduling
        headers = [
          ...headers,
          {
            text: this.$t('trans.submissionsTable.lateSubmission'),
            align: 'start',
            value: 'lateEntry',
          },
        ];
      }

      // Actions column at the end
      headers.push({
        text: this.$t('trans.submissionsTable.view'),
        align: 'end',
        value: 'actions',
        filterable: false,
        sortable: false,
        width: '40px',
      });

      // Actions column at the end
      headers.push({
        text: this.$t('trans.submissionsTable.event'),
        align: 'end',
        value: 'event',
        filterable: false,
        sortable: false,
        width: '40px',
      });
      return headers;
    },

    FILTER_HEADERS() {
      return [...this.DEFAULT_HEADER].filter(
        (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
      );
    },

    MODIFY_HEADERS() {
      return [
        {
          text: this.$t('trans.formSubmission.updatedAt'),
          align: 'start',
          value: 'updatedAt',
        },
        {
          text: this.$t('trans.formSubmission.updatedBy'),
          align: 'start',
          value: 'updatedBy',
        },
      ];
    },

    SELECT_COLUMNS_HEADERS() {
      return [...this.FILTER_HEADERS, ...this.MODIFY_HEADERS].concat(
        this.formFields.map((ff) => {
          return { text: ff, value: ff, align: 'end' };
        })
      );
    },

    HEADERS() {
      let headers = this.DEFAULT_HEADER;
      if (this.USER_PREFERENCES.length > 0) {
        headers = [...this.DEFAULT_HEADER].filter(
          (h) => !this.tableFilterIgnore.some((fd) => fd.value === h.value)
        );

        headers.splice(headers.length - 2, 0, ...this.USER_PREFERENCES);
      }

      return headers;
    },

    PRESELECTED_DATA() {
      return this.USER_PREFERENCES.length === 0
        ? this.FILTER_HEADERS
        : this.USER_PREFERENCES;
    },
    USER_PREFERENCES() {
      let preselectedData = [];
      if (this.userFormPreferences?.preferences?.columns) {
        preselectedData = this.userFormPreferences.preferences.columns.map(
          (column) => {
            if (column === 'date') {
              return {
                text: this.$t('trans.submissionsTable.submissionDate'),
                align: 'start',
                value: 'date',
              };
            } else if (column === 'submitter') {
              return {
                text: this.$t('trans.submissionsTable.submitter'),
                align: 'start',
                value: 'submitter',
              };
            } else if (column === 'status') {
              return {
                text: this.$t('trans.submissionsTable.status'),
                align: 'start',
                value: 'status',
              };
            } else if (column === 'updatedAt') {
              return {
                text: this.$t('trans.formSubmission.updatedAt'),
                align: 'start',
                value: 'updatedAt',
              };
            } else if (column === 'updatedBy') {
              return {
                text: this.$t('trans.formSubmission.updatedBy'),
                align: 'start',
                value: 'updatedBy',
              };
            } else {
              return {
                align: 'start',
                text: column,
                value: column,
              };
            }
          }
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
    onShowColumnDialog() {
      this.SELECT_COLUMNS_HEADERS.sort(
        (a, b) =>
          this.PRESELECTED_DATA.findIndex((x) => x.text === b.text) -
          this.PRESELECTED_DATA.findIndex((x) => x.text === a.text)
      );

      this.showColumnsDialog = true;
    },

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
    async updateTableOptions({ page, itemsPerPage, sortBy, sortDesc }) {
      this.page = page - 1;
      if (sortBy[0] === 'date') {
        this.sortBy = 'createdAt';
      } else if (sortBy[0] === 'submitter') {
        this.sortBy = 'createdBy';
      } else if (sortBy[0] === 'status')
        this.sortBy = 'formSubmissionStatusCode';
      else {
        this.sortBy = sortBy[0];
      }
      this.sortDesc = sortDesc[0];
      this.itemsPerPage = itemsPerPage;
      await this.getSubmissionData();
    },
    async getSubmissionData() {
      let criteria = {
        formId: this.formId,
        itemsPerPage: this.itemsPerPage,
        page: this.page,
        filterformSubmissionStatusCode: true,
        sortBy: this.sortBy,
        sortDesc: this.sortDesc,
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
      if (this.submissionList) {
        const tableRows = this.submissionList.map((s) => {
          const fields = {
            confirmationId: s.confirmationId,
            date: s.createdAt,
            updatedAt: s.updatedBy ? s.updatedAt : null,
            updatedBy: s.updatedBy,
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
    },
    async populateSubmissionsTable() {
      try {
        this.loading = true;
        // Get user prefs for this form
        await this.getFormPreferencesForCurrentUser(this.formId);
        // Get the submissions for this form
        await this.getSubmissionData();
        // Build up the list of forms for the table
      } catch (error) {
        // Handled in state fetchSubmissions
      } finally {
        this.loading = false;
      }
    },

    async refreshSubmissions() {
      this.loading = true;
      this.page = 0;
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
      this.showColumnsDialog = false;
      this.filterData = data;
      let preferences = {
        columns: [],
      };
      data.forEach((d) => {
        preferences.columns.push(d.value);
      });

      await this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: preferences,
      });

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
