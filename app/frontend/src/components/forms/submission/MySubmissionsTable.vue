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
    ...mapState(useFormStore, [
      'form',
      'formFields',
      'submissionList',
      'isRTL',
    ]),
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

      // Add the form fields to the headers
      hdrs = hdrs.concat(
        this.formFields.map((ff) => {
          return {
            title: ff,
            align: 'start',
            key: ff,
          };
        })
      );

      return hdrs;
    },
    HEADERS() {
      // Start with the headers that can exist
      let headers = this.DEFAULT_HEADERS;
      // If there is any filter data, then we can remove what isn't in there
      // but do not remove the values set inside of filter ignore, as those
      // should always exist (confirmationId, actions, event)
      if (this.filterData?.length > 0) {
        headers = headers.filter(
          (header) =>
            // It must be in the filter data
            this.filterData.some((up) => up.key === header.key) ||
            // Or in the filterIgnore
            this.filterIgnore.some((fi) => fi.key === header.key)
        );
      } else {
        // Remove the form fields
        headers = headers.filter(
          (header) => !this.formFields.includes(header.key)
        );
      }

      headers.push({
        title: i18n.t('trans.mySubmissionsTable.actions'),
        align: 'end',
        key: 'actions',
        filterable: false,
        sortable: false,
        width: '140px',
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

    onShowColumnDialog() {
      this.showColumnsDialog = true;
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
          this.filterData.forEach((fd) => {
            // If the field isn't already in fields
            if (!(fd.key in fields)) {
              fields[fd.key] = s.submission.submission.data[fd.key];
            }
          });
          return fields;
        });
        this.submissionsTable = tableRows;
      }
      this.loading = false;
    },

    async updateFilter(data) {
      this.filterData = data;
      this.showColumnsDialog = false;

      await this.populateSubmissionsTable();
    },
  },
};
</script>

<template>
  <div>
    <v-skeleton-loader :loading="loading" type="heading" class="bgtrans">
      <div
        class="mt-6 d-flex flex-md-row flex-1-1-100 justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
      >
        <!-- page title -->
        <div>
          <h1>{{ $t('trans.mySubmissionsTable.previousSubmissions') }}</h1>
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
                  v-bind="props"
                  size="x-small"
                  density="default"
                  icon="mdi:mdi-plus"
                />
              </router-link>
            </template>
            <span>{{
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
      />
    </div>

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
        :reset-data="FILTER_HEADERS"
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
