<template>
  <div>
    <v-skeleton-loader :loading="loading" type="heading">
      <v-row class="mt-6" no-gutters>
        <!-- page title -->
        <v-col cols="12" sm="6" order="2" order-sm="1">
          <h1>Previous Submissions</h1>
        </v-col>
        <!-- buttons -->
        <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
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
            <span>Create a New Submission</span>
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
      item-key="title"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
      no-data-text="You have no submissions"
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
        inputFilterPlaceholder="Search submission fields"
        inputItemKey="value"
        inputSaveButtonText="Save"
        :inputData="
          DEFAULT_HEADERS.filter(
            (h) => !filterIgnore.some((fd) => fd.value === h.value)
          )
        "
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
      filterData: [],
      filterIgnore: [
        {
          value: 'confirmationId',
        },
        {
          value: 'actions',
        },
      ],
      showColumnsDialog: false,
      submissionTable: [],
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['form', 'submissionList', 'permissions']),
    ...mapGetters('auth', ['user']),
    DEFAULT_HEADERS() {
      let headers = [
        {
          text: 'Confirmation Id',
          align: 'start',
          value: 'confirmationId',
          sortable: true,
        },
        {
          text: 'Created By',
          value: 'createdBy',
          sortable: true,
        },
        {
          text: 'Status Updated By',
          value: 'username',
          sortable: true,
        },
        {
          text: 'Status',
          value: 'status',
          sortable: true,
        },
        {
          text: 'Submission Date',
          value: 'submittedDate',
          sortable: true,
        },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '140px',
        },
      ];
      if (this.showDraftLastEdited || !this.formId) {
        headers.splice(headers.length - 1, 0, {
          text: 'Draft Updated By',
          align: 'start',
          value: 'updatedBy',
          sortable: true,
        });
        headers.splice(headers.length - 1, 0, {
          text: 'Draft Last Edited',
          align: 'start',
          value: 'lastEdited',
          sortable: true,
        });
      }
      return headers;
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
    PRESELECTED_DATA() {
      return this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
      );
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
    ...mapActions('form', ['fetchForm', 'fetchSubmissions']),

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
      await this.fetchSubmissions({ formId: this.formId, userView: true });
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
    await this.fetchForm(this.formId);
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
