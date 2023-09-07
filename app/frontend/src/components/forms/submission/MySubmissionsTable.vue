<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-skeleton-loader :loading="loading" type="heading">
      <div
        class="mt-6 d-flex flex-md-row justify-space-between flex-sm-row flex-xs-column-reverse"
      >
        <!-- page title -->
        <div>
          <h1 :lang="lang">
            {{ $t('trans.mySubmissionsTable.previousSubmissions') }}
          </h1>
          <h3>{{ formId ? form.name : 'All Forms' }}</h3>
        </div>
        <!-- buttons -->
        <div>
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
              $t('trans.mySubmissionsTable.selectColumns')
            }}</span>
          </v-tooltip>
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
            <span :lang="lang">{{
              $t('trans.mySubmissionsTable.createNewSubmission')
            }}</span>
          </v-tooltip>
        </div>
      </div>
    </v-skeleton-loader>

    <v-row no-gutters>
      <v-col cols="12">
        <!-- search input -->
        <div
          class="submissions-search"
          :class="isRTL ? 'float-left' : 'float-right'"
        >
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('trans.mySubmissionsTable.search')"
            single-line
            hide-details
            class="pb-5"
            :class="{ label: isRTL }"
            :lang="lang"
          />
        </div>
      </v-col>
    </v-row>
    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="HEADERS"
      item-key="title"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.mySubmissionsTable.loadingText')"
      :no-data-text="$t('trans.mySubmissionsTable.noDataText')"
      :lang="lang"
      :server-items-length="totalSubmissions"
      @update:options="updateTableOptions"
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
          :formId="formId"
          :isCopyFromExistingSubmissionEnabled="
            isCopyFromExistingSubmissionEnabled
          "
        />
      </template>
    </v-data-table>
    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :inputFilterPlaceholder="
          $t('trans.mySubmissionsTable.searchSubmissionFields')
        "
        inputItemKey="value"
        :inputSaveButtonText="$t('trans.mySubmissionsTable.save')"
        :inputData="SELECT_COLUMNS_HEADERS"
        :preselectedData="preSelectedData"
        :resetData="FILTER_HEADERS"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          ><span :lang="lang">{{
            $t('trans.mySubmissionsTable.filterTitle')
          }}</span></template
        >
      </BaseFilter>
    </v-dialog>
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
      headers: [],
      itemsPerPage: 10,
      page: 0,
      filterData: [],
      preSelectedData: [],
      sortBy: undefined,
      sortDesc: false,
      filterIgnore: [
        {
          value: 'confirmationId',
        },
        {
          value: 'actions',
        },
      ],
      tableFilterIgnore: [
        { value: 'createdBy' },
        { value: 'username' },
        { value: 'status' },
        { value: 'lateEntry' },
        { value: 'lastEdited' },
        { value: 'updatedBy' },
        { value: 'submittedDate' },
      ],
      showColumnsDialog: false,
      submissionTable: [],
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', [
      'form',
      'submissionList',
      'permissions',
      'formFields',
      'isRTL',
      'lang',
      'totalSubmissions',
    ]),
    ...mapGetters('auth', ['user']),
    DEFAULT_HEADERS() {
      let headers = [
        {
          text: this.$t('trans.mySubmissionsTable.confirmationId'),
          align: 'start',
          value: 'confirmationId',
          sortable: true,
        },
        {
          text: this.$t('trans.mySubmissionsTable.createdBy'),
          value: 'createdBy',
          sortable: true,
        },
        {
          text: this.$t('trans.mySubmissionsTable.statusUpdatedBy'),
          value: 'username',
          sortable: true,
        },
        {
          text: this.$t('trans.mySubmissionsTable.status'),
          value: 'status',
          sortable: true,
        },
        {
          text: this.$t('trans.mySubmissionsTable.submissionDate'),
          value: 'submittedDate',
          sortable: true,
        },
        {
          text: this.$t('trans.mySubmissionsTable.actions'),
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '140px',
        },
      ];
      if (this.showDraftLastEdited || !this.formId) {
        headers.splice(headers.length - 1, 0, {
          text: this.$t('trans.mySubmissionsTable.draftUpdatedBy'),
          align: 'start',
          value: 'updatedBy',
          sortable: true,
        });
        headers.splice(headers.length - 1, 0, {
          text: this.$t('trans.mySubmissionsTable.draftLastEdited'),
          align: 'start',
          value: 'lastEdited',
          sortable: true,
        });
      }
      return headers;
    },
    SELECT_COLUMNS_HEADERS() {
      return [...this.FILTER_HEADERS].concat(
        this.formFields?.map((ff) => {
          return { text: ff, value: ff, align: 'end' };
        })
      );
    },

    FILTER_HEADERS() {
      return this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
      );
    },

    HEADERS() {
      let headers = this.DEFAULT_HEADERS;

      if (this.filterData.length > 0) {
        headers = [...this.DEFAULT_HEADERS].filter(
          (h) => !this.tableFilterIgnore.some((fd) => fd.value === h.value)
        );

        headers.splice(headers.length - 1, 0, ...this.filterData);
      }
      return headers;
    },

    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
    showDraftLastEdited() {
      return this.form && this.form.enableSubmitterDraft;
    },
    isCopyFromExistingSubmissionEnabled() {
      return this.form && this.form.enableCopyExistingSubmission;
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'fetchSubmissions', 'fetchFormFields']),
    onShowColumnDialog() {
      this.preSelectedData =
        this.filterData.length === 0 ? this.FILTER_HEADERS : this.filterData;
      this.SELECT_COLUMNS_HEADERS.sort(
        (a, b) =>
          this.preSelectedData.findIndex((x) => x.text === b.text) -
          this.preSelectedData.findIndex((x) => x.text === a.text)
      );
      this.showColumnsDialog = true;
    },

    // Status columns in the table
    getCurrentStatus(record) {
      // Current status is most recent status (top in array, query returns in
      // status created desc)
      const status =
        record.submissionStatus && record.submissionStatus[0]
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
      await this.populateSubmissionsTable();
    },
    async populateSubmissionsTable() {
      this.loading = true;
      // Get the submissions for this form
      await this.fetchSubmissions({
        formId: this.formId,
        userView: true,
        itemsPerPage: this.itemsPerPage,
        page: this.page,
        sortBy: this.sortBy,
        sortDesc: this.sortDesc,
      });
      // Build up the list of forms for the table
      if (this.submissionList) {
        const tableRows = this.submissionList.map((s) => {
          const fields = {
            confirmationId: s.confirmationId,
            name: s.name,
            permissions: s.permissions,
            status: this.getCurrentStatus(s),
            submissionId: s.formSubmissionId,
            submittedDate: this.getStatusDate(s, 'SUBMITTED'),
            createdBy: s.submission.createdBy,
            updatedBy: s.draft ? s.submission.updatedBy : undefined,
            lastEdited: s.draft ? s.submission.updatedAt : undefined,
            username:
              s.submissionStatus && s.submissionStatus.length > 0
                ? s.submissionStatus[0].createdBy
                : '',
          };
          s?.submission?.submission?.data &&
            Object.keys(s.submission.submission.data).forEach((col) => {
              fields[col] = s.submission.submission.data[col];
            });
          return fields;
        });
        this.submissionTable = tableRows;
      }
      this.loading = false;
    },
    async updateFilter(data) {
      this.filterData = data;
      this.showColumnsDialog = false;
    },
  },

  async mounted() {
    await this.fetchForm(this.formId).then(async () => {
      await this.fetchFormFields({
        formId: this.formId,
        formVersionId: this.form.versions[0].id,
      });
    });

    await this.populateSubmissionsTable();
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
