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
      loading: true,
      search: '',
      showColumnsDialog: false,
      submissionsTable: [],
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'submissionList']),
    DEFAULT_HEADERS() {
      let hdrs = [
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
        {
          title: i18n.t('trans.mySubmissionsTable.actions'),
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
          width: '140px',
        },
      ];
      if (this.showDraftLastEdited || !this.formId) {
        hdrs.splice(hdrs.length - 1, 0, {
          title: i18n.t('trans.mySubmissionsTable.draftUpdatedBy'),
          align: 'start',
          key: 'updatedBy',
          sortable: true,
        });
        hdrs.splice(hdrs.length - 1, 0, {
          title: i18n.t('trans.mySubmissionsTable.draftLastEdited'),
          align: 'start',
          key: 'lastEdited',
          sortable: true,
        });
      }
      return hdrs;
    },
    FILTER_HEADERS() {
      return this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
      );
    },
    HEADERS() {
      return this.filterData.length === 0
        ? this.DEFAULT_HEADERS
        : this.filterData;
    },
    PRESELECTED_DATA() {
      return this.filterData.length === 0
        ? this.DEFAULT_HEADERS
        : this.filterData;
    },
    showDraftLastEdited() {
      return this.form && this.form.enableSubmitterDraft;
    },
    isCopyFromExistingSubmissionEnabled() {
      return this.form && this.form.enableCopyExistingSubmission;
    },
  },
  async mounted() {
    await this.fetchForm(this.formId);
    await this.populateSubmissionsTable();
  },
  methods: {
    ...mapActions(useFormStore, ['fetchForm', 'fetchSubmissions']),
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
          return {
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
        });
        this.submissionsTable = tableRows;
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
  <div>
    <v-skeleton-loader :loading="loading" type="heading">
      <v-row class="mt-6" no-gutters>
        <!-- page title -->
        <v-col cols="12" sm="6" order="2" order-sm="1">
          <h1>{{ $t('trans.mySubmissionsTable.previousSubmissions') }}</h1>
        </v-col>
        <!-- buttons -->
        <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-1"
                color="primary"
                icon
                size="small"
                v-bind="props"
                @click="showColumnsDialog = true"
              >
                <v-icon icon="mdi:mdi-view-column"></v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.mySubmissionsTable.selectColumns') }}</span>
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
                  icon
                  size="small"
                  v-bind="props"
                >
                  <v-icon icon="mdi:mdi-plus"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>{{
              $t('trans.mySubmissionsTable.createNewSubmission')
            }}</span>
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
            :label="$t('trans.mySubmissionsTable.search')"
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
      item-key="title"
      :items="submissionsTable"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.mySubmissionsTable.loadingText')"
      :no-data-text="$t('trans.mySubmissionsTable.noDataText')"
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
        input-item-key="key"
        :input-save-button-text="$t('trans.mySubmissionsTable.save')"
        :input-data="FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title>{{
          $t('trans.mySubmissionsTable.filterTitle')
        }}</template>
      </BaseFilter>
    </v-dialog>
  </div>
</template>

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
