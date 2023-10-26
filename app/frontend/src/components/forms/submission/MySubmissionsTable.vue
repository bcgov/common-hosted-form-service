<script>
import { mapActions, mapState } from 'pinia';

import { i18n } from '~/internationalization';
import BaseFilter from '~/components/base/BaseFilter.vue';
import MySubmissionsActions from '~/components/forms/submission/MySubmissionsActions.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseFilter,
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
      filterData: [],
      filterIgnore: [
        {
          key: 'confirmationId',
        },
        {
          key: 'actions',
        },
      ],
      headers: [],
      loading: true,
      search: '',
      serverItems: [],
      showColumnsDialog: false,
      tableFilterIgnore: [],
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'form',
      'formFields',
      'submissionList',
      'isRTL',
      'lang',
      'totalSubmissions',
    ]),

    //------------------------ TABLE HEADERS
    // These are headers that will be available by default for the
    // table in this view
    BASE_HEADERS() {
      let headers = [
        {
          title: i18n.t('trans.mySubmissionsTable.confirmationId'),
          align: 'start',
          key: 'confirmationId',
          sortable: true,
        },
        {
          title: i18n.t('trans.mySubmissionsTable.createdBy'),
          key: 'createdBy',
          sortable: true,
        },
        {
          title: i18n.t('trans.mySubmissionsTable.statusUpdatedBy'),
          key: 'username',
          sortable: true,
        },
        {
          title: i18n.t('trans.mySubmissionsTable.status'),
          key: 'status',
          sortable: true,
        },
        {
          title: i18n.t('trans.mySubmissionsTable.submissionDate'),
          key: 'submittedDate',
          sortable: true,
        },
      ];
      if (this.showDraftLastEdited || !this.formId) {
        headers.splice(headers.length - 1, 0, {
          title: i18n.t('trans.mySubmissionsTable.draftUpdatedBy'),
          align: 'start',
          key: 'updatedBy',
          sortable: true,
        });
        headers.splice(headers.length - 1, 0, {
          title: i18n.t('trans.mySubmissionsTable.draftLastEdited'),
          align: 'start',
          key: 'lastEdited',
          sortable: true,
        });
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
    // The headers are based on the base headers but are modified
    // by the following order:
    // Remove columns that aren't saved in the filter data
    HEADERS() {
      let headers = this.BASE_HEADERS;

      // The user selected some columns
      if (this.filterData.length > 0) {
        headers = headers.filter(
          (header) =>
            // It must be in the user selected columns
            this.filterData.some((fd) => fd.key === header.key) ||
            // except if it's in the filter ignore
            this.filterIgnore.some((fd) => fd.key === header.key)
        );
      } else {
        // Remove the form fields because this is the default view
        // we don't need all the form fields
        headers = headers.filter((header) => {
          // we want columns that aren't form fields
          return !this.formFields.includes(header.key);
        });
      }

      // Actions column at the end
      headers.push({
        title: this.$t('trans.mySubmissionsTable.actions'),
        align: 'end',
        key: 'actions',
        filterable: false,
        sortable: false,
        width: '40px',
      });

      return headers;
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
    showDraftLastEdited() {
      return this.form && this.form.enableSubmitterDraft;
    },
    isCopyFromExistingSubmissionEnabled() {
      return this.form && this.form.enableCopyExistingSubmission;
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
  methods: {
    ...mapActions(useFormStore, [
      'fetchForm',
      'fetchFormFields',
      'fetchSubmissions',
    ]),
    onShowColumnDialog() {
      this.BASE_FILTER_HEADERS.sort(
        (a, b) =>
          this.PRESELECTED_DATA.findIndex((x) => x.title === b.title) -
          this.PRESELECTED_DATA.findIndex((x) => x.title === a.title)
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
    async populateSubmissionsTable() {
      this.loading = true;
      // Get the submissions for this form
      await this.fetchSubmissions({
        formId: this.formId,
        userView: true,
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
              if (Object.keys(fields).includes(col)) {
                fields[`${col}_1`] = s.submission.submission.data[col];
              } else {
                fields[col] = s.submission.submission.data[col];
              }
            });
          return fields;
        });
        this.serverItems = tableRows;
      }
      this.loading = false;
    },

    async updateFilter(data) {
      this.filterData = data;
      this.showColumnsDialog = false;
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-skeleton-loader :loading="loading" type="heading">
      <div
        class="mt-6 d-flex flex-md-row flex-1-1-100 justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
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
          <v-tooltip location="bottom">
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
              $t('trans.mySubmissionsTable.selectColumns')
            }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link
                :to="{
                  name: 'FormSubmit',
                  query: { f: form.id },
                }"
              >
                <v-btn
                  class="mx-1"
                  color="primary"
                  v-bind="props"
                  size="x-small"
                  density="default"
                  icon="mdi:mdi-plus"
                />
              </router-link>
            </template>
            <span :lang="lang">{{
              $t('trans.mySubmissionsTable.createNewSubmission')
            }}</span>
          </v-tooltip>
        </div>
      </div>
    </v-skeleton-loader>

    <!-- search input -->
    <div
      class="submissions-search"
      :class="isRTL ? 'float-left' : 'float-right'"
    >
      <v-text-field
        v-model="search"
        density="compact"
        variant="underlined"
        :label="$t('trans.mySubmissionsTable.search')"
        append-inner-icon="mdi-magnify"
        single-line
        hide-details
        class="pb-5"
        :class="{ label: isRTL }"
        :lang="lang"
      />
    </div>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      hover
      :headers="HEADERS"
      item-value="title"
      :items="serverItems"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.mySubmissionsTable.loadingText')"
      :no-data-text="
        search.length > 0
          ? $t('trans.mySubmissionsTable.noMatchingRecordText')
          : $t('trans.mySubmissionsTable.noDataText')
      "
      :lang="lang"
    >
      <template #item.lastEdited="{ item }">
        {{ $filters.formatDateLong(item.columns.lastEdited) }}
      </template>
      <template #item.submittedDate="{ item }">
        {{ $filters.formatDateLong(item.columns.submittedDate) }}
      </template>
      <template #item.completedDate="{ item }">
        {{ $filters.formatDateLong(item.columns.completedDate) }}
      </template>
      <template #item.actions="{ item }">
        <MySubmissionsActions
          :submission="item.raw"
          :form-id="formId"
          :is-copy-from-existing-submission-enabled="
            isCopyFromExistingSubmissionEnabled
          "
          @draft-deleted="populateSubmissionsTable"
        />
      </template>
    </v-data-table>
    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :input-filter-placeholder="
          $t('trans.mySubmissionsTable.searchSubmissionFields')
        "
        :input-save-button-text="$t('trans.mySubmissionsTable.save')"
        :input-data="BASE_FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA"
        :reset-data="RESET_HEADERS"
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

<style scoped>
.submissions-search {
  width: 100%;
}
@media (min-width: 960px) {
  .submissions-search {
    max-width: 20em;
  }
}
@media (max-width: 959px) {
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
