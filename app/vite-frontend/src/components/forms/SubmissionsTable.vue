<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { FormManagePermissions } from '~/utils/constants';
import moment from 'moment';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const formStore = useFormStore();

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const { form, formFields, permissions, submissionList, userFormPreferences } =
  storeToRefs(formStore);

const { user } = storeToRefs(authStore);

const currentUserOnly = ref(false);
const deleteItem = ref({});
const deletedOnly = ref(false);
const filterData = ref([]);
const filterIgnore = ref([
  {
    value: 'confirmationId',
  },
  {
    value: 'actions',
  },
  {
    value: 'event',
  },
]);
const loading = ref(true);
const restoreItem = ref({});
const search = ref('');
const showColumnsDialog = ref(false);
const showRestoreDialog = ref(false);
const submissionTable = ref([]);
const showDeleteDialog = ref(false);
const selectedSubmissions = ref([]);
const singleSubmissionDelete = ref(false);
const singleSubmissionRestore = ref(false);
const switchSubmissionView = ref(false);

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

const checkFormManage = computed(() =>
  permissions.value.some((p) => FormManagePermissions.includes(p))
);
const DEFAULT_HEADERS = computed(() => {
  let headers = [
    {
      text: t('trans.submissionsTable.confirmationID'),
      align: 'start',
      value: 'confirmationId',
    },
  ];

  if (userFormPreferences.value?.preferences?.columns) {
    if (userFormPreferences.value.preferences.columns.includes('date')) {
      headers = [
        ...headers,
        {
          text: t('trans.submissionsTable.submissionDate'),
          align: 'start',
          value: 'date',
        },
      ];
    }

    if (userFormPreferences.value.preferences.columns.includes('submitter')) {
      headers = [
        ...headers,
        {
          text: t('trans.submissionsTable.submitter'),
          align: 'start',
          value: 'submitter',
        },
      ];
    }

    if (userFormPreferences.value.preferences.columns.includes('status')) {
      headers = [
        ...headers,
        {
          text: t('trans.submissionsTable.status'),
          align: 'start',
          value: 'status',
        },
      ];
    }
  } else {
    headers = [
      ...headers,
      {
        text: t('trans.submissionsTable.submissionDate'),
        align: 'start',
        value: 'date',
      },
      {
        text: t('trans.submissionsTable.submitter'),
        align: 'start',
        value: 'submitter',
      },
      {
        text: t('trans.submissionsTable.status'),
        align: 'start',
        value: 'status',
      },
    ];
  }

  if (form.value && form.value.schedule && form.value.schedule.enabled) {
    //push new header for late submission if Form is setup for scheduling
    headers = [
      ...headers,
      {
        text: t('trans.submissionsTable.lateSubmission'),
        align: 'start',
        value: 'lateEntry',
      },
    ];
  }

  // Add any custom columns if the user has them
  const maxHeaderLength = 25;
  userColumns.value.forEach((col) => {
    headers.push({
      text:
        col.length > maxHeaderLength
          ? `${col.substring(0, maxHeaderLength)}...`
          : col,
      align: 'end',
      value: col,
    });
  });

  // Actions column at the end
  headers.push({
    text: t('trans.submissionsTable.view'),
    align: 'end',
    value: 'actions',
    filterable: false,
    sortable: false,
    width: '40px',
  });

  // Actions column at the end
  headers.push({
    text: t('trans.submissionsTable.event'),
    align: 'end',
    value: 'event',
    filterable: false,
    sortable: false,
    width: '40px',
  });

  return headers.filter((x) => x.value !== 'updatedAt' || deletedOnly.value);
});

const HEADERS = computed(() => {
  let headers = DEFAULT_HEADERS.value;
  if (filterData.value.length > 0)
    headers = headers.filter(
      (h) =>
        filterData.value.some((fd) => fd.value === h.value) ||
        filterIgnore.value.some((ign) => ign.value === h.value)
    );
  return headers;
});

const FILTER_HEADERS = computed(() => {
  let filteredHeader = DEFAULT_HEADERS.value
    .filter((h) => !filterIgnore.value.some((fd) => fd.value === h.value))
    .concat(
      formFields.value.map((ff) => {
        return { text: ff, value: ff, align: 'end' };
      })
    );

  filteredHeader = [
    {
      text: t('trans.submissionsTable.submissionDate'),
      align: 'start',
      value: 'date',
    },
    {
      text: t('trans.submissionsTable.submitter'),
      align: 'start',
      value: 'submitter',
    },
    {
      text: t('trans.submissionsTable.status'),
      align: 'start',
      value: 'status',
    },
    ...filteredHeader,
  ];

  return filteredHeader.filter(function (item, index, inputArray) {
    return (
      inputArray.findIndex((arrayItem) => arrayItem.value === item.value) ==
      index
    );
  });
});

const PRESELECTED_DATA = computed(() => {
  let preselectedData = [];
  if (userFormPreferences.value?.preferences?.columns) {
    preselectedData = userFormPreferences.value.preferences.columns.map(
      (column) => {
        return {
          align: 'end',
          text: column,
          value: column,
        };
      }
    );
  } else {
    preselectedData = DEFAULT_HEADERS.value.filter(
      (h) => !filterIgnore.value.some((fd) => fd.value === h.value)
    );
  }
  return preselectedData;
});

const userColumns = computed(() => {
  if (
    userFormPreferences.value &&
    userFormPreferences.value.preferences &&
    userFormPreferences.value.preferences.columns
  ) {
    // Compare saved user prefs against the current form versions component names and remove any discrepancies
    return userFormPreferences.value.preferences.columns.filter(
      (x) => formFields.value.indexOf(x) !== -1
    );
  } else {
    return [];
  }
});

async function delSub() {
  singleSubmissionDelete.value ? deleteSingleSubs() : deleteMultiSubs();
}

async function restoreSub() {
  singleSubmissionRestore.value ? restoreSingleSub() : restoreMultipleSubs();
}

async function deleteSingleSubs() {
  showDeleteDialog.value = false;
  await formStore.deleteSubmission(deleteItem.value.submissionId);
  refreshSubmissions();
}

async function deleteMultiSubs() {
  let submissionsIdsToDelete = selectedSubmissions.value.map(
    (submission) => submission.submissionId
  );
  showDeleteDialog.value = false;
  await formStore.deleteMultiSubmissions({
    submissionIds: submissionsIdsToDelete,
    formId: properties.formId,
  });
  refreshSubmissions();
}

async function populateSubmissionsTable() {
  try {
    loading.value = true;
    // Get user prefs for this form
    await this.getFormPreferencesForCurrentUser(properties.formId);
    // Get the submissions for this form
    let criteria = {
      formId: properties.formId,
      createdAt: Object.values({
        minDate:
          userFormPreferences.value &&
          userFormPreferences.value.preferences &&
          userFormPreferences.value.preferences.filter
            ? moment(
                userFormPreferences.value.preferences.filter[0],
                'YYYY-MM-DD hh:mm:ss'
              )
                .utc()
                .format()
            : moment()
                .subtract(50, 'years')
                .utc()
                .format('YYYY-MM-DD hh:mm:ss'), //Get User filter Criteria (Min Date)
        maxDate:
          userFormPreferences.value &&
          userFormPreferences.value.preferences &&
          userFormPreferences.value.preferences.filter
            ? moment(
                userFormPreferences.value.preferences.filter[1],
                'YYYY-MM-DD hh:mm:ss'
              )
                .utc()
                .format()
            : moment().add(50, 'years').utc().format('YYYY-MM-DD hh:mm:ss'), //Get User filter Criteria (Max Date)
      }),
      deletedOnly: deletedOnly.value,
      createdBy: currentUserOnly.value
        ? `${user.value.username}@${user.value.idp}`
        : '',
    };
    await formStore.fetchSubmissions(criteria);
    // Build up the list of forms for the table
    if (submissionList.value) {
      const tableRows = submissionList.value
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
          userColumns.value.forEach((col) => {
            fields[col] = s[col];
          });
          return fields;
        });
      submissionTable.value = tableRows;
    }
  } catch (error) {
    // Handled in state fetchSubmissions
  } finally {
    loading.value = false;
  }
}

async function refreshSubmissions() {
  loading.value = true;
  Promise.all([
    await formStore.getFormRolesForUser(properties.formId),
    await formStore.getFormPermissionsForUser(properties.formId),
    await formStore.fetchForm(properties.formId).then(async () => {
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
    })
    .finally(() => {
      selectedSubmissions.value = [];
    });
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
  let submissionsIdsToRestore = selectedSubmissions.value.map(
    (submission) => submission.submissionId
  );
  showRestoreDialog.value = false;
  await formStore.restoreMultiSubmissions({
    submissionIds: submissionsIdsToRestore,
    formId: properties.formId,
  });
  refreshSubmissions();
  selectedSubmissions.value = [];
}

async function updateFilter(data) {
  filterData.value = data;
  let preferences = {
    columns: [],
  };
  data.forEach((d) => {
    if (formFields.value.includes(d.value)) preferences.columns.push(d.value);
  });

  await formStore.updateFormPreferencesForCurrentUser({
    formId: form.value.id,
    preferences: preferences,
  });
  showColumnsDialog.value = false;
  await this.populateSubmissionsTable();
}

onMounted(() => {
  refreshSubmissions();
});
</script>

<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>{{ $t('trans.formsTable.submissions') }}</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <span v-if="checkFormManage">
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
            <span>{{ $t('trans.submissionsTable.selectColumns') }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  size="small"
                  v-bind="props"
                >
                  <v-icon icon="mdi:mdi-cog"></v-icon>
                </v-btn>
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
                  icon
                  size="small"
                  v-bind="props"
                >
                  <v-icon icon="mdi:mdi-download"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>{{ $t('trans.submissionsTable.submissionsToFiles') }}</span>
          </v-tooltip>
        </span>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="4" sm="4">
        <v-checkbox
          v-model="deletedOnly"
          class="pl-3"
          :label="$t('trans.submissionsTable.showDeletedSubmissions')"
          @click="refreshSubmissions"
        />
      </v-col>
      <v-col cols="4" sm="4">
        <v-checkbox
          v-model="currentUserOnly"
          class="pl-3"
          :label="$t('trans.submissionsTable.showMySubmissions')"
          @click="refreshSubmissions"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('trans.submissionsTable.search')"
            single-line
            hide-details
            class="pb-5"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      v-model="selectedSubmissions"
      class="submissions-table"
      :headers="HEADERS"
      item-key="submissionId"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      :show-select="!switchSubmissionView"
      :loading-text="$t('trans.submissionsTable.loadingText')"
      :no-data-text="$t('trans.submissionsTable.noDataText')"
    >
      <template #[`header.event`]>
        <span v-if="!deletedOnly">
          <v-btn
            color="red"
            :disabled="selectedSubmissions.length === 0"
            icon
            @click="(showDeleteDialog = true), (singleSubmissionDelete = false)"
          >
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon color="red" dark v-bind="props">remove_circle</v-icon>
              </template>
              <span>{{
                $t('trans.submissionsTable.delSelectedSubmissions')
              }}</span>
            </v-tooltip>
          </v-btn>
        </span>
        <span v-if="deletedOnly">
          <v-btn
            color="red"
            :disabled="selectedSubmissions.length === 0"
            icon
            @click="
              (showRestoreDialog = true), (singleSubmissionRestore = false)
            "
          >
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon color="green" dark v-bind="props"
                  >restore_from_trash</v-icon
                >
              </template>
              <span>{{
                $t('trans.submissionsTable.resSelectedSubmissions')
              }}</span>
            </v-tooltip>
          </v-btn>
        </span>
      </template>

      <template #[`item.date`]="{ item }">
        {{ $filters.formatDateLong(item.raw.date) }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ item.status }}
      </template>
      <template #[`item.lateEntry`]="{ item }">
        {{
          item.lateEntry === true
            ? $t('trans.submissionsTable.yes')
            : $t('trans.submissionsTable.no')
        }}
      </template>
      <template #[`item.actions`]="{ item }">
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
              <v-btn color="primary" icon v-bind="props">
                <v-icon>remove_red_eye</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span>{{ $t('trans.submissionsTable.viewSubmission') }}</span>
        </v-tooltip>
      </template>
      <template #[`item.event`]="{ item }">
        <span>
          <v-tooltip v-if="!item.deleted" location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                icon
                v-bind="props"
                @click="
                  (showDeleteDialog = true),
                    (deleteItem = item),
                    (singleSubmissionDelete = true)
                "
              >
                <v-icon>remove_circle</v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.submissionsTable.deleteSubmission') }}</span>
          </v-tooltip>
        </span>
        <span v-if="item.deleted">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="green"
                icon
                v-bind="props"
                @click="
                  restoreItem = item;
                  showRestoreDialog = true;
                  singleSubmissionRestore = true;
                "
              >
                <v-icon>restore_from_trash</v-icon>
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
        input-item-key="value"
        :input-save-button-text="$t('trans.submissionsTable.save')"
        :input-data="FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA"
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
