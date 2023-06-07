<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseFilter from '~/components/base/BaseFilter.vue';
import MySubmissionsActions from '~/components/forms/submission/MySubmissionsActions.vue';
import { useFormStore } from '~/store/form';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();

const filterData = ref([]);
const filterIgnore = ref([
  {
    key: 'confirmationId',
  },
  {
    key: 'actions',
  },
]);
const loading = ref(true);
const search = ref('');
const showColumnsDialog = ref(false);
const submissionsTable = ref([]);

const { form, submissionList } = storeToRefs(formStore);

const DEFAULT_HEADERS = computed(() => {
  let hdrs = [
    {
      title: t('trans.mySubmissionsTable.confirmationId'),
      align: 'start',
      key: 'confirmationId',
      sortable: true,
    },
    {
      title: t('trans.mySubmissionsTable.createdBy'),
      key: 'createdBy',
      sortable: true,
    },
    {
      title: t('trans.mySubmissionsTable.statusUpdatedBy'),
      key: 'username',
      sortable: true,
    },
    {
      title: t('trans.mySubmissionsTable.status'),
      key: 'status',
      sortable: true,
    },
    {
      title: t('trans.mySubmissionsTable.submissionDate'),
      key: 'submittedDate',
      sortable: true,
    },
    {
      title: t('trans.mySubmissionsTable.actions'),
      align: 'end',
      key: 'actions',
      filterable: false,
      sortable: false,
      width: '140px',
    },
  ];
  if (showDraftLastEdited.value || !properties.formId) {
    hdrs.splice(hdrs.length - 1, 0, {
      title: t('trans.mySubmissionsTable.draftUpdatedBy'),
      align: 'start',
      key: 'updatedBy',
      sortable: true,
    });
    hdrs.splice(hdrs.length - 1, 0, {
      title: t('trans.mySubmissionsTable.draftLastEdited'),
      align: 'start',
      key: 'lastEdited',
      sortable: true,
    });
  }
  return hdrs;
});

const HEADERS = computed(() => {
  let hdrs = DEFAULT_HEADERS.value;
  if (filterData.value.length > 0)
    hdrs = hdrs.filter(
      (h) =>
        filterData.value.some((fd) => fd.key === h.key) ||
        filterIgnore.value.some((ign) => ign.key === h.key)
    );
  return hdrs;
});

const PRESELECTED_DATA = computed(() =>
  DEFAULT_HEADERS.value.filter(
    (h) => !filterIgnore.value.some((fd) => fd.key === h.key)
  )
);

const showDraftLastEdited = computed(
  () => form.value && form.value.enableSubmitterDraft
);

const isCopyFromExistingSubmissionEnabled = computed(
  () => form.value && form.value.enableCopyExistingSubmission
);

// Status columns in the table
function getCurrentStatus(record) {
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
}

function getStatusDate(record, statusCode) {
  // Get the created date of the most recent occurence of a specified status
  if (record.submissionStatus) {
    const submittedStatus = record.submissionStatus.find(
      (stat) => stat.code === statusCode
    );
    if (submittedStatus) return submittedStatus.createdAt;
  }
  return '';
}

async function populateSubmissionsTable() {
  loading.value = true;
  // Get the submissions for this form
  await formStore.fetchSubmissions({
    formId: properties.formId,
    userView: true,
  });
  // Build up the list of forms for the table
  if (submissionList.value) {
    const tableRows = submissionList.value.map((s) => {
      return {
        confirmationId: s.confirmationId,
        name: s.name,
        permissions: s.permissions,
        status: getCurrentStatus(s),
        submissionId: s.formSubmissionId,
        submittedDate: getStatusDate(s, 'SUBMITTED'),
        createdBy: s.submission.createdBy,
        updatedBy: s.draft ? s.submission.updatedBy : undefined,
        lastEdited: s.draft ? s.submission.updatedAt : undefined,
        username:
          s.submissionStatus && s.submissionStatus.length > 0
            ? s.submissionStatus[0].createdBy
            : '',
      };
    });
    submissionsTable.value = tableRows;
  }
  loading.value = false;
}

async function updateFilter(data) {
  filterData.value = data;
  showColumnsDialog.value = false;
}

onMounted(async () => {
  await formStore.fetchForm(properties.formId);
  await populateSubmissionsTable();
});
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
          :submission="item"
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
        :input-data="
          DEFAULT_HEADERS.filter(
            (h) => !filterIgnore.some((fd) => fd.key === h.key)
          )
        "
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
