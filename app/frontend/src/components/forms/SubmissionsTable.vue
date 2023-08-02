<script>
import moment from 'moment';
import { mapActions, mapState } from 'pinia';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import { i18n } from '~/internationalization';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { FormManagePermissions } from '~/utils/constants';

export default {
  components: {
    BaseDialog,
    BaseFilter,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      currentUserOnly: false,
      deleteItem: {},
      deletedOnly: false,
      filterIgnore: [
        {
          key: 'confirmationId',
        },
        {
          key: 'actions',
        },
        {
          key: 'event',
        },
      ],
      loading: true,
      restoreItem: {},
      search: '',
      showColumnsDialog: false,
      showRestoreDialog: false,
      submissionTable: [],
      showDeleteDialog: false,
      selectedSubmissions: [],
      singleSubmissionDelete: false,
      singleSubmissionRestore: false,
      switchSubmissionView: false,
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'form',
      'formFields',
      'permissions',
      'submissionList',
      'userFormPreferences',
    ]),
    ...mapState(useAuthStore, ['user']),
    multiDeleteMessage() {
      return i18n.t('trans.submissionsTable.multiDelWarning');
    },
    singleDeleteMessage() {
      return i18n.t('trans.submissionsTable.singleDelWarning');
    },
    multiRestoreMessage() {
      return i18n.t('trans.submissionsTable.multiRestoreWarning');
    },
    singleRestoreMessage() {
      return i18n.t('trans.submissionsTable.singleRestoreWarning');
    },
    checkFormManage() {
      return this.permissions.some((p) => FormManagePermissions.includes(p));
    },
    DEFAULT_HEADERS() {
      // Confirmation ID should always be in the table
      // Default headers always include the submissionDate, submitter, and status
      // The BaseFilter uses this data so it knows it exists
      // If the table in THIS VIEW doesn't need it, it can filter it out in a computed value
      // These however are the values that can exist in this table aside from form values
      let headers = [
        {
          title: i18n.t('trans.submissionsTable.confirmationID'),
          align: 'start',
          key: 'confirmationId',
        },
        {
          title: i18n.t('trans.submissionsTable.submissionDate'),
          align: 'start',
          key: 'date',
        },
        {
          title: i18n.t('trans.submissionsTable.submitter'),
          align: 'start',
          key: 'submitter',
        },
        {
          title: i18n.t('trans.submissionsTable.status'),
          align: 'start',
          key: 'status',
        },
      ];

      if (this.form && this.form.schedule && this.form.schedule.enabled) {
        //push new header for late submission if Form is setup for scheduling
        headers = [
          ...headers,
          {
            title: i18n.t('trans.submissionsTable.lateSubmission'),
            align: 'start',
            key: 'lateEntry',
          },
        ];
      }

      // Add the form fields to the headers
      headers = headers.concat(
        this.formFields.map((ff) => {
          return {
            title: ff,
            align: 'start',
            key: ff,
          };
        })
      );

      return headers;
    },

    // These are the headers that are displayed in this table, not in BaseFilter
    HEADERS() {
      // Start with the headers that can exist
      let headers = this.DEFAULT_HEADERS;
      // If there are any user preferences, then we can remove what isn't in there
      // but do not remove the values set inside of filter ignore, as those
      // should always exist (confirmationId, actions, event)
      if (this.USER_PREFERENCES?.length > 0) {
        headers = headers.filter(
          (header) =>
            // It must be in the user preferences
            this.USER_PREFERENCES.some((up) => up.key === header.key) ||
            // Or in the filterIgnore
            this.filterIgnore.some((fi) => fi.key === header.key)
        );
      } else {
        // Remove the form fields
        headers = headers.filter(
          (header) => !this.formFields.includes(header.key)
        );
      }

      // Actions column at the end
      headers.push({
        title: i18n.t('trans.submissionsTable.view'),
        align: 'end',
        key: 'actions',
        filterable: false,
        sortable: false,
        width: '40px',
      });

      // Event column at the end
      headers.push({
        title: i18n.t('trans.submissionsTable.event'),
        align: 'end',
        key: 'event',
        filterable: false,
        sortable: false,
        width: '40px',
      });
      return headers;
    },

    FILTER_HEADERS() {
      return this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.key === h.key)
      );
    },
    PRESELECTED_DATA() {
      return this.HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.key === h.key)
      );
    },
    USER_PREFERENCES() {
      let preselectedData = [];
      if (this.userFormPreferences?.preferences?.columns) {
        preselectedData = this.userFormPreferences.preferences.columns.map(
          (column) => {
            if (column === 'date') {
              return {
                title: this.$t('trans.submissionsTable.submissionDate'),
                align: 'start',
                key: 'date',
              };
            } else if (column === 'submitter') {
              return {
                title: this.$t('trans.submissionsTable.submitter'),
                align: 'start',
                key: 'submitter',
              };
            } else if (column === 'status') {
              return {
                title: this.$t('trans.submissionsTable.status'),
                align: 'start',
                key: 'status',
              };
            } else {
              return {
                align: 'start',
                title: column,
                key: column,
              };
            }
          }
        );
      }
      return preselectedData;
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
  },
  watch: {
    deletedOnly() {
      this.selectedSubmissions = [];
    },
  },
  mounted() {
    this.refreshSubmissions();
  },
  methods: {
    ...mapActions(useFormStore, [
      'deleteMultiSubmissions',
      'deleteSubmission',
      'fetchForm',
      'fetchFormFields',
      'fetchSubmissions',
      'getFormPermissionsForUser',
      'getFormPreferencesForCurrentUser',
      'getFormRolesForUser',
      'restoreSubmission',
      'restoreMultiSubmissions',
      'updateFormPreferencesForCurrentUser',
    ]),
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
      this.showDeleteDialog = false;
      await this.deleteMultiSubmissions({
        submissionIds: this.selectedSubmissions,
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
        await this.getFormRolesForUser(this.formId),
        await this.getFormPermissionsForUser(this.formId),
        await this.fetchForm(this.formId).then(async () => {
          if (this.form.versions?.length > 0) {
            await this.fetchFormFields({
              formId: this.formId,
              formVersionId: this.form.versions[0].id,
            });
          }
        }),
      ]).finally(async () => {
        await this.populateSubmissionsTable();
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
      this.showRestoreDialog = false;
      await this.restoreMultiSubmissions({
        submissionIds: this.selectedSubmissions,
        formId: this.formId,
      });
      this.refreshSubmissions();
      this.selectedSubmissions = [];
    },
    async updateFilter(data) {
      this.showColumnsDialog = false;
      let preferences = {
        columns: [],
      };
      data.forEach((d) => {
        preferences.columns.push(d.key);
      });

      await this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: preferences,
      });

      await this.populateSubmissionsTable();
    },
  },
};
</script>

<template>
  <div>
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1>{{ $t('trans.formsTable.submissions') }}</h1>
      </div>
      <!-- buttons -->
      <div>
        <span v-if="checkFormManage">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-1"
                color="primary"
                v-bind="props"
                size="x-small"
                density="default"
                icon="mdi:mdi-view-column"
                @click="showColumnsDialog = true"
              />
            </template>
            <span>{{ $t('trans.submissionsTable.selectColumns') }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  v-bind="props"
                  :disabled="!formId"
                  size="x-small"
                  density="default"
                  icon="mdi:mdi-cog"
                />
              </router-link>
            </template>
            <span>{{ $t('trans.submissionsTable.manageForm') }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link
                :to="{ name: 'SubmissionsExport', query: { f: formId } }"
              >
                <v-btn
                  class="mx-1"
                  color="primary"
                  v-bind="props"
                  size="x-small"
                  density="default"
                  icon="mdi:mdi-download"
                />
              </router-link>
            </template>
            <span>{{ $t('trans.submissionsTable.submissionsToFiles') }}</span>
          </v-tooltip>
        </span>
      </div>
    </div>

    <div
      class="mt-5 mb-5 d-flex flex-md-row justify-space-between flex-sm-column flex-xs-column"
    >
      <v-checkbox
        v-model="deletedOnly"
        class="pl-3"
        :label="$t('trans.submissionsTable.showDeletedSubmissions')"
        @click="refreshSubmissions"
      />

      <v-checkbox
        v-model="currentUserOnly"
        class="pl-3"
        :label="$t('trans.submissionsTable.showMySubmissions')"
        @click="refreshSubmissions"
      />

      <!-- search input -->
      <div class="submissions-search">
        <v-text-field
          v-model="search"
          density="compact"
          variant="underlined"
          :label="$t('trans.submissionsTable.search')"
          append-inner-icon="mdi-magnify"
          single-line
          hide-details
          class="pb-5"
        ></v-text-field>
      </div>
    </div>

    <!-- table header -->
    <v-data-table
      v-model="selectedSubmissions"
      class="submissions-table"
      :headers="HEADERS"
      item-value="submissionId"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      :show-select="!switchSubmissionView"
      :loading-text="$t('trans.submissionsTable.loadingText')"
      :no-data-text="$t('trans.submissionsTable.noDataText')"
    >
      <template #column.event>
        <span v-if="!deletedOnly">
          <v-btn
            color="red"
            :disabled="selectedSubmissions.length === 0"
            icon="mdi:mdi-minus"
            size="x-small"
            @click="(showDeleteDialog = true), (singleSubmissionDelete = false)"
          >
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon color="white" dark v-bind="props" />
              </template>
              <span>{{
                $t('trans.submissionsTable.delSelectedSubmissions')
              }}</span>
            </v-tooltip>
          </v-btn>
        </span>
        <span v-if="deletedOnly">
          <v-btn
            :disabled="selectedSubmissions.length === 0"
            icon
            size="x-small"
            @click="
              (showRestoreDialog = true), (singleSubmissionRestore = false)
            "
          >
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon
                  color="green"
                  dark
                  v-bind="props"
                  icon="mdi:mdi-delete-restore"
                  size="24"
                />
              </template>
              <span>{{
                $t('trans.submissionsTable.resSelectedSubmissions')
              }}</span>
            </v-tooltip>
          </v-btn>
        </span>
      </template>

      <template #item.date="{ item }">
        {{ $filters.formatDateLong(item.columns.date) }}
      </template>
      <template #item.status="{ item }">
        {{ item.columns.status }}
      </template>
      <template #item.lateEntry="{ item }">
        {{
          item.columns.lateEntry === true
            ? $t('trans.submissionsTable.yes')
            : $t('trans.submissionsTable.no')
        }}
      </template>
      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <router-link
              :to="{
                name: 'FormView',
                query: {
                  s: item.raw.submissionId,
                },
              }"
            >
              <v-btn color="primary" icon size="x-small" v-bind="props">
                <v-icon icon="mdi:mdi-eye"></v-icon>
              </v-btn>
            </router-link>
          </template>
          <span>{{ $t('trans.submissionsTable.viewSubmission') }}</span>
        </v-tooltip>
      </template>
      <template #item.event="{ item }">
        <span>
          <v-tooltip v-if="!item.raw.deleted" location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                icon
                size="x-small"
                v-bind="props"
                @click="
                  (showDeleteDialog = true),
                    (deleteItem = item.raw),
                    (singleSubmissionDelete = true)
                "
              >
                <v-icon icon="mdi:mdi-minus" color="white"></v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.submissionsTable.deleteSubmission') }}</span>
          </v-tooltip>
        </span>
        <span v-if="item.raw.deleted">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                icon
                size="x-small"
                v-bind="props"
                @click="
                  restoreItem = item.raw;
                  showRestoreDialog = true;
                  singleSubmissionRestore = true;
                "
              >
                <v-icon color="green" icon="mdi:mdi-delete-restore" size="24" />
              </v-btn>
            </template>
            <span>{{ $t('trans.submissionsTable.restore') }}</span>
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
        <span>{{ $t('trans.submissionsTable.delete') }}</span>
      </template>
    </BaseDialog>
    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restoreSub"
    >
      <template #title>{{
        $t('trans.submissionsTable.confirmRestoration')
      }}</template>
      <template #text>
        {{
          singleSubmissionRestore ? singleRestoreMessage : multiRestoreMessage
        }}
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.submissionsTable.restore') }}</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :input-filter-placeholder="
          $t('trans.submissionsTable.searchSubmissionFields')
        "
        :input-save-button-text="$t('trans.submissionsTable.save')"
        :input-data="FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA"
        :reset-data="
          FILTER_HEADERS.filter((header) => !formFields.includes(header.key))
        "
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title>{{
          $t('trans.submissionsTable.searchTitle')
        }}</template>
      </BaseFilter>
    </v-dialog>
  </div>
</template>

<style scoped>
.submissions-search {
  width: 20em !important;
}
@media only screen and (max-width: 960px) {
  .submissions-search {
    padding-left: 20px;
    padding-right: 16px;
  }
}

.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table :deep(tbody tr:nth-of-type(odd)) {
  background-color: #f5f5f5;
}
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
