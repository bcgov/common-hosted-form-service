<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseFilter from '~/components/base/BaseFilter.vue';
import MySubmissionsActions from '~/components/forms/submission/MySubmissionsActions.vue';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

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
const serverItems = ref([]);
const showColumnsDialog = ref(false);

const formStore = useFormStore();

const { form, formFields, mySubmissionPreferences, submissionList, isRTL } =
  storeToRefs(formStore);

//------------------------ TABLE HEADERS
// These are headers that will be available by default for the
// table in this view
const BASE_HEADERS = computed(() => {
  let headers = [
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
  ];

  if (showDraftLastEdited.value) {
    headers.splice(headers.length - 1, 0, {
      title: t('trans.mySubmissionsTable.draftUpdatedBy'),
      align: 'start',
      key: 'updatedBy',
      sortable: true,
    });
    headers.splice(headers.length - 1, 0, {
      title: t('trans.mySubmissionsTable.draftLastEdited'),
      align: 'start',
      key: 'lastEdited',
      sortable: true,
    });
  }

  // Add the form fields to the headers
  headers = headers.concat(
    formFields.value.map((ff) => {
      return {
        title: ff,
        align: 'start',
        key: ff,
      };
    })
  );
  return headers;
});

// The headers are based on the base headers but are modified
// by the following order:
// Remove columns that aren't saved in the filter data
const HEADERS = computed(() => {
  let headers = BASE_HEADERS.value;

  // The user selected some columns
  if (USER_PREFERENCES.value.length > 0) {
    headers = headers.filter(
      (header) =>
        // It must be in the user selected columns
        USER_PREFERENCES.value.some((up) => up === header.key) ||
        // except if it's in the filter ignore
        filterIgnore.value.some((fd) => fd.key === header.key)
    );
  } else {
    // Remove the form fields because this is the default view
    // we don't need all the form fields
    headers = headers.filter((header) => {
      // we want columns that aren't form fields
      return !formFields.value.includes(header.key);
    });
  }

  // Actions column at the end
  headers.push({
    title: t('trans.mySubmissionsTable.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
    width: '40px',
  });

  return headers;
});
//------------------------ END TABLE HEADERS

//------------------------ FILTER COLUMNS
// The base filter headers that will be available by default for the
// base filter. These are all the base headers in the table in this view
// with specific fields ignored because we always want specific fields
// to be available in the table in this view. For this reason, we don't
// add them to the table in the filter.
const BASE_FILTER_HEADERS = computed(() => {
  let headers = BASE_HEADERS.value.filter(
    (h) => !filterIgnore.value.some((fd) => fd.key === h.key)
  );
  return headers;
});

// When clicking reset on the base filter, these will be the default
// preselected values
const RESET_HEADERS = computed(() => {
  let headers = BASE_FILTER_HEADERS.value;
  // Remove the form fields because this is the default view
  // we don't need all the form fields
  headers = headers
    .filter((header) => {
      // we want columns that aren't form fields
      return (
        !formFields.value.includes(header.key) &&
        // These values won't be preselected
        !filterIgnore.value.some((fi) => fi.key === header.key)
      );
    })
    .map((h) => h.key);
  return headers;
});

// These are the columns that will be selected by default when the
// select columns dialog is opened
const PRESELECTED_DATA = computed(() => {
  return HEADERS.value.filter(
    (h) => !filterIgnore.value.some((fd) => fd.key === h.key)
  );
});

const showDraftLastEdited = computed(
  () => form.value && form.value.enableSubmitterDraft
);

const isCopyFromExistingSubmissionEnabled = computed(
  () => form.value && form.value.enableCopyExistingSubmission
);

// These are columns that the user has previously selected
// through the select columns dialog. These are columns
// that they wish to see in the table in this view.
const USER_PREFERENCES = computed(() => {
  let preselectedData = [];
  if (
    mySubmissionPreferences.value?.preferences?.formId &&
    mySubmissionPreferences.value.preferences.formId == properties.formId &&
    mySubmissionPreferences.value?.preferences?.columns
  ) {
    preselectedData = mySubmissionPreferences.value.preferences.columns;
  }
  return preselectedData;
});

onBeforeMount(async () => {
  await Promise.all([
    await formStore.fetchForm(properties.formId),
    await formStore.fetchFormFields({
      formId: properties.formId,
      formVersionId: form.value.versions[0].id,
    }),
    await populateSubmissionsTable(),
  ]);
});

function onShowColumnDialog() {
  BASE_FILTER_HEADERS.value.sort(
    (a, b) =>
      PRESELECTED_DATA.value.findIndex((x) => x.title === b.title) -
      PRESELECTED_DATA.value.findIndex((x) => x.title === a.title)
  );

  showColumnsDialog.value = true;
}

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
      let fields = {
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
      s?.submission?.submission?.data &&
        Object.keys(s.submission.submission.data).forEach((col) => {
          let colData = s.submission.submission.data[col];
          if (!(typeof colData === 'string' || typeof colData === 'number')) {
            // The data isn't a string or number, so we should turn it into a string
            colData = JSON.stringify(colData);
          }
          // this functionality might be broken, Object.keys will remove duplicate values
          // so we shouldn't find more than one key with the same name
          if (Object.keys(fields).includes(col)) {
            let suffixNum = 1;
            while (Object.keys(fields).includes(col + '_' + suffixNum)) {
              suffixNum++;
            }
            fields[`${col}_${suffixNum}`] = colData;
          } else {
            fields[col] = colData;
          }
        });
      return fields;
    });
    serverItems.value = tableRows;
  }
  loading.value = false;
}

async function updateFilter(data) {
  let preferences = {
    formId: properties.formId,
    columns: [],
  };
  data.forEach((d) => {
    preferences.columns.push(d);
  });
  mySubmissionPreferences.value.preferences = preferences;
  showColumnsDialog.value = false;
}

defineExpose({
  BASE_FILTER_HEADERS,
  BASE_HEADERS,
  filterIgnore,
  getCurrentStatus,
  getStatusDate,
  HEADERS,
  onShowColumnDialog,
  populateSubmissionsTable,
  PRESELECTED_DATA,
  serverItems,
  showColumnsDialog,
  RESET_HEADERS,
  updateFilter,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-skeleton-loader :loading="loading" type="heading">
      <div
        class="mt-6 d-flex flex-md-row flex-1-1-100 justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
      >
        <!-- page title -->
        <div>
          <h1 :lang="locale">
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
                :title="$t('trans.mySubmissionsTable.selectColumns')"
                @click="onShowColumnDialog"
              />
            </template>
            <span :lang="locale">{{
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
                  :title="$t('trans.mySubmissionsTable.createNewSubmission')"
                />
              </router-link>
            </template>
            <span :lang="locale">{{
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
        :lang="locale"
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
      :lang="locale"
    >
      <template #item.lastEdited="{ item }">
        {{ $filters.formatDateLong(item.lastEdited) }}
      </template>
      <template #item.submittedDate="{ item }">
        {{ $filters.formatDateLong(item.submittedDate) }}
      </template>
      <template #item.completedDate="{ item }">
        {{ $filters.formatDateLong(item.completedDate) }}
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
        :input-save-button-text="$t('trans.mySubmissionsTable.save')"
        :input-data="BASE_FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA.map((pd) => pd.key)"
        :reset-data="RESET_HEADERS"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          ><span :lang="locale">{{
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
