<script>
import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapState } from 'pinia';
import { ref } from 'vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import { i18n } from '~/internationalization';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { checkFormManage, checkSubmissionView } from '~/utils/permissionUtils';

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
      // Show only items for the current logged in user
      currentUserOnly: false,
      debounceInput: null,
      deleteItem: {},
      // Show only deleted items
      deletedOnly: false,
      filterData: [],
      search: '',
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
      forceTableRefresh: ref(0),
      itemsPerPage: 10,
      loading: true,
      page: 1,
      restoreItem: {},
      selectedSubmissions: [],
      serverItems: [],
      showColumnsDialog: false,
      showDeleteDialog: false,
      showRestoreDialog: false,
      singleSubmissionDelete: false,
      singleSubmissionRestore: false,
      sortBy: {},
      firstDataLoad: true,
      // When filtering, this data will not be preselected when clicking reset
      tableFilterIgnore: [
        { key: 'updatedAt' },
        { key: 'updatedBy' },
        { key: 'lateEntry' },
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'deletedSubmissions',
      'form',
      'formFields',
      'isRTL',
      'lang',
      'permissions',
      'roles',
      'submissionList',
      'totalSubmissions',
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
    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
    showFormManage() {
      return this.checkFormManage(this.permissions);
    },
    showSelectColumns() {
      return (
        this.checkFormManage(this.permissions) ||
        this.checkSubmissionView(this.permissions)
      );
    },
    showSubmissionsExport() {
      // For now use form management to indicate that the user can export
      // submissions. In the future it should be its own set of permissions.
      return this.checkFormManage(this.permissions);
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

    //------------------------ TABLE HEADERS
    // These are headers that will be available by default for the
    // table in this view
    BASE_HEADERS() {
      let headers = [
        {
          title: this.$t('trans.submissionsTable.confirmationID'),
          align: 'start',
          key: 'confirmationId',
        },
        {
          title: this.$t('trans.submissionsTable.submissionDate'),
          align: 'start',
          key: 'date',
        },
        {
          title: this.$t('trans.submissionsTable.submitter'),
          align: 'start',
          key: 'submitter',
        },
        {
          title: this.$t('trans.submissionsTable.status'),
          align: 'start',
          key: 'status',
        },
      ];

      if (this.form && this.form.schedule && this.form.schedule.enabled) {
        //push new header for late submission if Form is setup for scheduling
        headers = [
          ...headers,
          {
            title: this.$t('trans.submissionsTable.lateSubmission'),
            align: 'start',
            key: 'lateEntry',
          },
        ];
      }

      // We add the modified columns so a form reviewer can see
      // which user last modified a submission and when
      headers = headers.concat([
        {
          title: this.$t('trans.formSubmission.updatedAt'),
          align: 'start',
          key: 'updatedAt',
        },
        {
          title: this.$t('trans.formSubmission.updatedBy'),
          align: 'start',
          key: 'updatedBy',
        },
      ]);

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
    // The headers are based on the base headers but are modified
    // by the following order:
    // Add CRUD options to headers
    // Remove columns that aren't saved in the user preferences
    HEADERS() {
      let headers = this.BASE_HEADERS;
      // If the user selected columns previously, then we remove
      // all columns they don't want to see, barring the columns
      // that are in filterIgnore as they should always be available
      if (this.USER_PREFERENCES.length > 0) {
        headers = headers.filter(
          (h) =>
            // It must be in the user preferences
            this.USER_PREFERENCES.some((up) => up.key === h.key) ||
            // except if it's in the filter ignore
            this.filterIgnore.some((fd) => fd.key === h.key)
        );
      } else {
        // Remove the form fields because this is the default view
        // we don't need all the form fields
        headers = headers.filter((header) => {
          // we want columns that aren't form fields
          return (
            !this.formFields.includes(header.key) &&
            // or that aren't updatedAt
            header.key !== 'updatedAt' &&
            // or aren't updatedBy
            header.key !== 'updatedBy'
          );
        });
      }

      // Actions column at the end
      headers.push({
        title: this.$t('trans.submissionsTable.view'),
        align: 'end',
        key: 'actions',
        filterable: false,
        sortable: false,
        width: '40px',
      });

      // Actions column at the end
      headers.push({
        title: this.$t('trans.submissionsTable.event'),
        align: 'end',
        key: 'event',
        filterable: false,
        sortable: false,
        width: '40px',
      });
      return headers;
    },
    // These are columns that the user has previously selected
    // through the select columns dialog. These are columns
    // that they wish to see in the table in this view.
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
    //------------------------ END TABLE HEADERS

    //------------------------ FILTER COLUMNS
    // The base filter headers that will be available by default for the
    // base filter. These are all the base headers in the table in this view
    // with specific fields ignored because we always want specific fields
    // to be available in the table in this view. For this reason, we don't
    // add them to the table in the filter.
    BASE_FILTER_HEADERS() {
      let headers = this.BASE_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.key === h.key)
      );
      return headers;
    },
    // When clicking reset on the base filter, these will be the default
    // preselected values
    RESET_HEADERS() {
      let headers = this.BASE_FILTER_HEADERS;
      // Remove the form fields because this is the default view
      // we don't need all the form fields
      headers = headers.filter((header) => {
        // we want columns that aren't form fields
        return (
          !this.formFields.includes(header.key) &&
          // These values won't be preselected
          !this.tableFilterIgnore.some((fi) => fi.key === header.key)
        );
      });
      return headers;
    },
    // These are the columns that will be selected by default when the
    // select columns dialog is opened
    PRESELECTED_DATA() {
      return this.HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.key === h.key)
      );
    },
    //------------------------ END FILTER COLUMNS
  },
  async mounted() {
    this.debounceInput = _.debounce(async () => {
      this.forceTableRefresh += 1;
    }, 300);
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
    ...mapActions('notifications', ['addNotification']),

    checkFormManage: checkFormManage,
    checkSubmissionView: checkSubmissionView,

    onShowColumnDialog() {
      this.BASE_FILTER_HEADERS.sort(
        (a, b) =>
          this.PRESELECTED_DATA.findIndex((x) => x.title === b.title) -
          this.PRESELECTED_DATA.findIndex((x) => x.title === a.title)
      );

      this.showColumnsDialog = true;
    },
    async updateTableOptions({ page, itemsPerPage, sortBy }) {
      this.page = page;
      if (sortBy?.length > 0) {
        if (sortBy[0].key === 'date') {
          this.sortBy.column = 'createdAt';
        } else if (sortBy[0].key === 'submitter') {
          this.sortBy.column = 'createdBy';
        } else if (sortBy[0].key === 'status') {
          this.sortBy.column = 'formSubmissionStatusCode';
        } else {
          this.sortBy.column = sortBy[0].key;
        }
        this.sortBy.order = sortBy[0].order;
      } else {
        this.sortBy = {};
      }
      this.itemsPerPage = itemsPerPage;
      if (!this.firstDataLoad) {
        await this.refreshSubmissions();
      }
      this.firstDataLoad = false;
    },
    async getSubmissionData() {
      let criteria = {
        formId: this.formId,
        itemsPerPage: this.itemsPerPage,
        page: this.page - 1,
        filterformSubmissionStatusCode: true,
        paginationEnabled: true,
        sortBy: this.sortBy,
        search: this.search,
        searchEnabled: this.search.length > 0 ? true : false,
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
            if (Object.keys(fields).includes(col)) {
              fields[`${col}_1`] = s[col];
            } else {
              fields[col] = s[col];
            }
          });
          return fields;
        });
        this.serverItems = tableRows;
        this.submissionsCheckboxes = new Array(this.serverItems.length).fill(
          false
        );
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
          this.loading = false;
        })
        .finally(() => {
          this.selectedSubmissions = [];
        });
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
      let submissionIdsToDelete = this.selectedSubmissions.map(
        (submission) => submission.submissionId
      );
      this.showDeleteDialog = false;
      await this.deleteMultiSubmissions({
        submissionIds: submissionIdsToDelete,
        formId: this.formId,
      });
      this.refreshSubmissions();
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
      let submissionIdsToRestore = this.selectedSubmissions.map(
        (submission) => submission.submissionId
      );
      this.showRestoreDialog = false;
      await this.restoreMultiSubmissions({
        submissionIds: submissionIdsToRestore,
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
        preferences.columns.push(d.key);
      });

      await this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: preferences,
      });
      await this.populateSubmissionsTable();
    },
    async handleSearch(value) {
      this.search = value;
      if (value === '') {
        await this.refreshSubmissions();
      } else {
        this.debounceInput();
      }
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1 :lang="lang">{{ $t('trans.formsTable.submissions') }}</h1>
      </div>
      <!-- buttons -->
      <div>
        <span>
          <v-tooltip v-if="showSelectColumns" location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-1"
                color="primary"
                v-bind="props"
                size="x-small"
                density="default"
                icon="mdi:mdi-view-column"
                @click="onShowColumnDialog"
              />
            </template>
            <span :lang="lang">{{
              $t('trans.submissionsTable.selectColumns')
            }}</span>
          </v-tooltip>
          <v-tooltip v-if="showFormManage" location="bottom">
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
            <span :lang="lang">{{
              $t('trans.submissionsTable.manageForm')
            }}</span>
          </v-tooltip>
          <v-tooltip v-if="showSubmissionsExport" location="bottom">
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
            <span :lang="lang">{{
              $t('trans.submissionsTable.submissionsToFiles')
            }}</span>
          </v-tooltip>
        </span>
      </div>
    </div>

    <div
      class="mt-5 mb-5 d-flex flex-md-row justify-space-between flex-sm-column flex-xs-column"
    >
      <div>
        <v-checkbox
          v-model="deletedOnly"
          class="pl-3"
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
          v-model="currentUserOnly"
          class="pl-3"
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
            density="compact"
            variant="underlined"
            :label="$t('trans.submissionsTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ label: isRTL }"
            :lang="lang"
            @update:modelValue="handleSearch"
          ></v-text-field>
        </div>
      </div>
    </div>

    <!-- table header -->
    <v-data-table-server
      :key="forceTableRefresh"
      v-model="selectedSubmissions"
      hover
      :items-length="totalSubmissions"
      class="submissions-table"
      :items-per-page="itemsPerPage"
      :headers="HEADERS"
      item-value="submissionId"
      :items="serverItems"
      show-select
      :loading="loading"
      :loading-text="$t('trans.submissionsTable.loadingText')"
      :no-data-text="
        search.length > 0
          ? $t('trans.submissionsTable.noMatchingRecordText')
          : $t('trans.submissionsTable.noDataText')
      "
      :lang="lang"
      return-object
      @update:options="updateTableOptions"
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
              <span :lang="lang">{{
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
              <span :lang="lang">{{
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
        <span :lang="lang">
          {{
            item.lateEntry === true
              ? $t('trans.submissionsTable.yes')
              : $t('trans.submissionsTable.no')
          }}
        </span>
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
          <span :lang="lang">{{
            $t('trans.submissionsTable.viewSubmission')
          }}</span>
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
            <span :lang="lang">{{
              $t('trans.submissionsTable.deleteSubmission')
            }}</span>
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
            <span :lang="lang">{{ $t('trans.submissionsTable.restore') }}</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table-server>

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
        :input-filter-placeholder="
          $t('trans.submissionsTable.searchSubmissionFields')
        "
        :input-save-button-text="$t('trans.submissionsTable.save')"
        :input-data="BASE_FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA"
        :reset-data="RESET_HEADERS"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
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

<style scoped>
.submissions-search {
  width: 20em !important;
}
@media only screen and (max-width: 960px) {
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
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}

.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
