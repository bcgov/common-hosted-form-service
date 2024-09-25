<script setup>
import _ from 'lodash';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { checkFormManage, checkSubmissionView } from '~/utils/permissionUtils';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

// Show only items for the current logged in user
const currentUserOnly = ref(false);
const debounceInput = ref(null);
const debounceTime = ref(300);
const deleteItem = ref({});
// Show only deleted items
const deletedOnly = ref(false);
const search = ref('');
const filterIgnore = ref([
  {
    key: 'confirmationId',
  },
  {
    key: 'actions',
  },
  {
    key: 'event',
  },
]);
const forceTableRefresh = ref(0);
const itemsPP = ref(10);
const loading = ref(true);
const currentPage = ref(1);
const restoreItem = ref({});
const selectedSubmissions = ref([]);
const serverItems = ref([]);
const showColumnsDialog = ref(false);
const showDeleteDialog = ref(false);
const showRestoreDialog = ref(false);
const singleSubmissionDelete = ref(false);
const singleSubmissionRestore = ref(false);
const sort = ref({});
const firstDataLoad = ref(true);
// When filtering, this data will not be preselected when clicking reset
const tableFilterIgnore = ref([
  { key: 'updatedAt' },
  { key: 'updatedBy' },
  { key: 'lateEntry' },
]);

const authStore = useAuthStore();
const formStore = useFormStore();

const { user } = storeToRefs(authStore);

const {
  form,
  formFields,
  isRTL,
  permissions,
  submissionList,
  totalSubmissions,
  userFormPreferences,
} = storeToRefs(formStore);

const multiDeleteMessage = computed(() =>
  t('trans.submissionsTable.multiDelWarning')
);
const singleDeleteMessage = computed(() =>
  t('trans.submissionsTable.singleDelWarning')
);
const multiRestoreMessage = computed(() =>
  t('trans.submissionsTable.multiRestoreWarning')
);
const singleRestoreMessage = computed(() =>
  t('trans.submissionsTable.singleRestoreWarning')
);
const showFormManage = computed(() => checkFormManage(permissions.value));
const showSelectColumns = computed(
  () =>
    checkFormManage(permissions.value) || checkSubmissionView(permissions.value)
);
const showSubmissionsExport = computed(() =>
  // For now use form management to indicate that the user can export
  // submissions. In the future it should be its own set of permissions.
  checkFormManage(permissions.value)
);
const userColumns = computed(() => {
  if (
    userFormPreferences.value &&
    userFormPreferences.value.preferences &&
    userFormPreferences.value.preferences.columns
  ) {
    // if we have any objects inside o
    // Compare saved user prefs against the current form versions component names and remove any discrepancies
    return userFormPreferences.value.preferences.columns.filter(
      (x) => formFields.value.indexOf(x) !== -1
    );
  } else {
    return [];
  }
});

//------------------------ TABLE HEADERS
// These are headers that will be available by default for the
// table in this view
const BASE_HEADERS = computed(() => {
  let headers = [
    {
      title: t('trans.submissionsTable.confirmationID'),
      align: 'start',
      key: 'confirmationId',
    },
    {
      title: t('trans.submissionsTable.submissionDate'),
      align: 'start',
      key: 'date',
    },
    {
      title: t('trans.submissionsTable.submitter'),
      align: 'start',
      key: 'submitter',
    },
    {
      title: t('trans.submissionsTable.status'),
      align: 'start',
      key: 'status',
    },
  ];

  if (form.value && form.value.schedule && form.value.schedule.enabled) {
    //push new header for late submission if Form is setup for scheduling
    headers = [
      ...headers,
      {
        title: t('trans.submissionsTable.lateSubmission'),
        align: 'start',
        key: 'lateEntry',
      },
    ];
  }

  // We add the modified columns so a form reviewer can see
  // which user last modified a submission and when
  headers = headers.concat([
    {
      title: t('trans.formSubmission.updatedAt'),
      align: 'start',
      key: 'updatedAt',
    },
    {
      title: t('trans.formSubmission.updatedBy'),
      align: 'start',
      key: 'updatedBy',
    },
  ]);

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
// Add CRUD options to headers
// Remove columns that aren't saved in the user preferences
const HEADERS = computed(() => {
  let headers = BASE_HEADERS.value;
  // If the user selected columns previously, then we remove
  // all columns they don't want to see, barring the columns
  // that are in filterIgnore as they should always be available
  if (USER_PREFERENCES.value.length > 0) {
    headers = headers.filter(
      (h) =>
        // It must be in the user preferences
        USER_PREFERENCES.value.some((up) => up === h.key) ||
        // except if it's in the filter ignore
        filterIgnore.value.some((fd) => fd.key === h.key)
    );
  } else {
    // Remove the form fields because this is the default view
    // we don't need all the form fields
    headers = headers.filter((header) => {
      // we want columns that aren't form fields
      return (
        !formFields.value.includes(header.key) &&
        // or that aren't updatedAt
        header.key !== 'updatedAt' &&
        // or aren't updatedBy
        header.key !== 'updatedBy'
      );
    });
  }

  // Actions column at the end
  headers.push({
    title: t('trans.submissionsTable.view'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
    width: '40px',
  });

  // Actions column at the end
  headers.push({
    title: t('trans.submissionsTable.event'),
    align: 'end',
    key: 'event',
    filterable: false,
    sortable: false,
    width: '40px',
  });
  return headers;
});

// These are columns that the user has previously selected
// through the select columns dialog. These are columns
// that they wish to see in the table in this view.
const USER_PREFERENCES = computed(() => {
  let preselectedData = [];
  if (userFormPreferences.value?.preferences?.columns) {
    preselectedData = userFormPreferences.value.preferences.columns;
  }
  return preselectedData;
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
        !tableFilterIgnore.value.some((fi) => fi.key === header.key)
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
//------------------------ END FILTER COLUMNS

onMounted(async () => {
  debounceInput.value = _.debounce(async () => {
    forceTableRefresh.value += 1;
  }, debounceTime.value);
  refreshSubmissions();
});

function onShowColumnDialog() {
  BASE_FILTER_HEADERS.value.sort(
    (a, b) =>
      PRESELECTED_DATA.value.findIndex((x) => x.title === b.title) -
      PRESELECTED_DATA.value.findIndex((x) => x.title === a.title)
  );

  showColumnsDialog.value = true;
}

async function updateTableOptions({ page, itemsPerPage, sortBy }) {
  if (page) {
    currentPage.value = page;
  }
  if (sortBy?.length > 0) {
    if (sortBy[0].key === 'date') {
      sort.value.column = 'createdAt';
    } else if (sortBy[0].key === 'submitter') {
      sort.value.column = 'createdBy';
    } else if (sortBy[0].key === 'status') {
      sort.value.column = 'formSubmissionStatusCode';
    } else {
      sort.value.column = sortBy[0].key;
    }
    sort.value.order = sortBy[0].order;
  } else {
    sort.value = {};
  }
  if (itemsPerPage) {
    itemsPP.value = itemsPerPage;
  }
  if (!firstDataLoad.value) {
    await refreshSubmissions();
  }
  firstDataLoad.value = false;
}

async function getSubmissionData() {
  let criteria = {
    formId: properties.formId,
    itemsPerPage: itemsPP.value,
    page: currentPage.value - 1,
    filterformSubmissionStatusCode: true,
    paginationEnabled: true,
    sortBy: sort.value,
    search: search.value,
    searchEnabled: search.value.length > 0 ? true : false,
    createdAt: Object.values({
      minDate:
        userFormPreferences.value &&
        userFormPreferences.value.preferences &&
        userFormPreferences.value.preferences.filter
          ? moment(
              userFormPreferences.value.preferences.filter[0],
              'YYYY-MM-DD'
            )
              .utc()
              .format()
          : moment().subtract(50, 'years').utc().format('YYYY-MM-DD'), //Get User filter Criteria (Min Date)
      maxDate:
        userFormPreferences.value &&
        userFormPreferences.value.preferences &&
        userFormPreferences.value.preferences.filter
          ? moment(
              userFormPreferences.value.preferences.filter[1],
              'YYYY-MM-DD'
            )
              .utc()
              .format()
          : moment().add(50, 'years').utc().format('YYYY-MM-DD'), //Get User filter Criteria (Max Date)
    }),
    deletedOnly: deletedOnly.value,
    createdBy: currentUserOnly.value
      ? `${user.value.username}@${user.value.idp?.code}`
      : '',
  };
  await formStore.fetchSubmissions(criteria);
  if (submissionList.value) {
    const tableRows = submissionList.value.map((s) => {
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
      userColumns.value.forEach((col) => {
        let colData = s[col];
        if (!(typeof colData === 'string' || typeof colData === 'number')) {
          // The data isn't a string or number, so we should turn it into a string
          colData = JSON.stringify(colData);
        }
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
}

async function populateSubmissionsTable() {
  try {
    loading.value = true;
    // Get user prefs for this form
    await formStore.getFormPreferencesForCurrentUser(properties.formId);
    // Get the submissions for this form
    await getSubmissionData();
    // Build up the list of forms for the table
  } catch (error) {
    // Handled in state fetchSubmissions
  } finally {
    loading.value = false;
  }
}

async function refreshSubmissions() {
  loading.value = true;
  Promise.all([
    formStore.getFormRolesForUser(properties.formId),
    formStore.getFormPermissionsForUser(properties.formId),
    formStore.fetchForm(properties.formId).then(async () => {
      if (form.value.versions?.length > 0) {
        await formStore.fetchFormFields({
          formId: properties.formId,
          formVersionId: form.value.versions[0].id,
        });
      }
    }),
  ])
    .then(async () => {
      await populateSubmissionsTable();
      loading.value = false;
    })
    .finally(() => {
      selectedSubmissions.value = [];
    });
}

async function delSub() {
  singleSubmissionDelete.value
    ? await deleteSingleSubs()
    : await deleteMultiSubs();
}

async function restoreSub() {
  singleSubmissionRestore.value
    ? await restoreSingleSub()
    : await restoreMultipleSubs();
}

async function deleteSingleSubs() {
  showDeleteDialog.value = false;
  await formStore.deleteSubmission(deleteItem.value.submissionId);
  refreshSubmissions();
}

async function deleteMultiSubs() {
  let submissionIdsToDelete = selectedSubmissions.value.map(
    (submission) => submission.submissionId
  );
  showDeleteDialog.value = false;
  await formStore.deleteMultiSubmissions({
    submissionIds: submissionIdsToDelete,
    formId: properties.formId,
  });
  refreshSubmissions();
}

async function restoreSingleSub() {
  await formStore.restoreSubmission({
    submissionId: restoreItem.value.submissionId,
    deleted: false,
  });
  showRestoreDialog.value = false;
  refreshSubmissions();
}

async function restoreMultipleSubs() {
  let submissionIdsToRestore = selectedSubmissions.value.map(
    (submission) => submission.submissionId
  );
  showRestoreDialog.value = false;
  await formStore.restoreMultiSubmissions({
    submissionIds: submissionIdsToRestore,
    formId: properties.formId,
  });
  refreshSubmissions();
  selectedSubmissions.value = [];
}

async function updateFilter(data) {
  showColumnsDialog.value = false;
  let preferences = {
    columns: [],
  };
  data.forEach((d) => {
    preferences.columns.push(d);
  });

  await formStore.updateFormPreferencesForCurrentUser({
    formId: form.value.id,
    preferences: preferences,
  });
  await populateSubmissionsTable();
}

async function handleSearch(value) {
  search.value = value;
  if (value === '') {
    await refreshSubmissions();
  } else {
    debounceInput.value();
  }
}

defineExpose({
  BASE_FILTER_HEADERS,
  BASE_HEADERS,
  debounceInput,
  debounceTime,
  delSub,
  filterIgnore,
  firstDataLoad,
  forceTableRefresh,
  getSubmissionData,
  handleSearch,
  HEADERS,
  itemsPP,
  multiDeleteMessage,
  multiRestoreMessage,
  onShowColumnDialog,
  currentPage,
  restoreSub,
  serverItems,
  showColumnsDialog,
  showFormManage,
  showSelectColumns,
  showSubmissionsExport,
  singleDeleteMessage,
  singleRestoreMessage,
  singleSubmissionDelete,
  singleSubmissionRestore,
  sort,
  updateFilter,
  userColumns,
  USER_PREFERENCES,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1 :lang="locale">{{ $t('trans.formsTable.submissions') }}</h1>
        <h3>{{ formId ? form.name : 'All Forms' }}</h3>
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
                :title="$t('trans.submissionsTable.selectColumns')"
                @click="onShowColumnDialog"
              />
            </template>
            <span :lang="locale">{{
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
                  :title="$t('trans.submissionsTable.manageForm')"
                />
              </router-link>
            </template>
            <span :lang="locale">{{
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
                  :title="$t('trans.submissionsTable.submissionsToFiles')"
                />
              </router-link>
            </template>
            <span :lang="locale">{{
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
            <span :class="{ 'mr-2': isRTL }" :lang="locale">
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
            <span :class="{ 'mr-2': isRTL }" :lang="locale">
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
            :lang="locale"
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
      :items-per-page="itemsPP"
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
      :lang="locale"
      return-object
      @update:options="updateTableOptions"
    >
      <template #header.event>
        <span v-if="!deletedOnly">
          <v-btn
            color="red"
            :disabled="selectedSubmissions.length === 0"
            icon="mdi:mdi-minus"
            size="x-small"
            :title="$t('trans.submissionsTable.delSelectedSubmissions')"
            @click="(showDeleteDialog = true), (singleSubmissionDelete = false)"
          >
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon color="white" dark v-bind="props" />
              </template>
              <span :lang="locale">{{
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
            :title="$t('trans.submissionsTable.resSelectedSubmissions')"
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
              <span :lang="locale">{{
                $t('trans.submissionsTable.resSelectedSubmissions')
              }}</span>
            </v-tooltip>
          </v-btn>
        </span>
      </template>

      <template #item.date="{ item }">
        {{ $filters.formatDateLong(item.date) }}
      </template>
      <template #item.status="{ item }">
        {{ item.status }}
      </template>
      <template #item.lateEntry="{ item }">
        <span :lang="locale">
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
                  s: item.submissionId,
                },
              }"
            >
              <v-btn
                color="primary"
                icon
                size="x-small"
                v-bind="props"
                :title="$t('trans.submissionsTable.viewSubmission')"
              >
                <v-icon icon="mdi:mdi-eye"></v-icon>
              </v-btn>
            </router-link>
          </template>
          <span :lang="locale">{{
            $t('trans.submissionsTable.viewSubmission')
          }}</span>
        </v-tooltip>
      </template>
      <template #item.event="{ item }">
        <span>
          <v-tooltip v-if="!item.deleted" location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                icon
                size="x-small"
                v-bind="props"
                :title="$t('trans.submissionsTable.deleteSubmission')"
                @click="
                  (showDeleteDialog = true),
                    (deleteItem = item),
                    (singleSubmissionDelete = true)
                "
              >
                <v-icon icon="mdi:mdi-minus" color="white"></v-icon>
              </v-btn>
            </template>
            <span :lang="locale">{{
              $t('trans.submissionsTable.deleteSubmission')
            }}</span>
          </v-tooltip>
        </span>
        <span v-if="item.deleted">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                icon
                size="x-small"
                v-bind="props"
                :title="$t('trans.submissionsTable.restore')"
                @click="
                  restoreItem = item;
                  showRestoreDialog = true;
                  singleSubmissionRestore = true;
                "
              >
                <v-icon color="green" icon="mdi:mdi-delete-restore" size="24" />
              </v-btn>
            </template>
            <span :lang="locale">{{
              $t('trans.submissionsTable.restore')
            }}</span>
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
        <span :lang="locale">{{ $t('trans.submissionsTable.delete') }}</span>
      </template>
    </BaseDialog>
    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restoreSub"
    >
      <template #title
        ><span :lang="locale">
          {{ $t('trans.submissionsTable.confirmRestoration') }}</span
        ></template
      >
      <template #text>
        {{
          singleSubmissionRestore ? singleRestoreMessage : multiRestoreMessage
        }}
      </template>
      <template #button-text-continue>
        <span :lang="locale">{{ $t('trans.submissionsTable.restore') }}</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :input-filter-placeholder="
          $t('trans.submissionsTable.searchSubmissionFields')
        "
        :input-data="BASE_FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA.map((pd) => pd.key)"
        :reset-data="RESET_HEADERS"
        :input-save-button-text="$t('trans.submissionsTable.save')"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          ><span :lang="locale">
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
