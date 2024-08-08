<script setup>
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';

import formService from '~/services/formService.js';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes, ExportLargeData } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const csvFormats = ref('multiRowEmptySpacesCSVExport');
const dateRange = ref(false);
const endDate = ref(moment(new Date()).format('YYYY-MM-DD'));
const endDateRules = ref([
  (v) => !!v || t('trans.formSettings.fieldRequired'),
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
  (v) =>
    moment(v).isAfter(startDate.value, 'day') ||
    'End date should be greater than start date.',
]);
const exportFormat = ref('json');
const formFieldsSearchFilter = ref('');
const formVersions = ref([]);
// This has the form fields in the table
// Table selection does not work if we use a computed value
const items = ref([]);
const loading = ref(false);
const selectedFormFields = ref([]);
const selectedVersion = ref(0);
const startDate = ref(moment(new Date()).format('YYYY-MM-DD'));
const startDateRules = ref([
  (v) => !!v || t('trans.formSettings.fieldRequired'),
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
  (v) =>
    moment(v).isBefore(moment(new Date()).format('YYYY-MM-DD'), 'day') ||
    'Start date should be less than today.',
]);

const authStore = useAuthStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { email } = storeToRefs(authStore);
const { form, formFields, isRTL, submissionList } = storeToRefs(formStore);

const FILENAME = computed(
  () => `${form.value.snake}_submissions.${exportFormat.value}`
);
const FORM_UNPUBLISHED = computed(
  () =>
    form.value &&
    form.value.versions &&
    form.value.versions.every((version) => !version.published)
);
const headers = computed(() => [
  {
    title: t('trans.exportSubmissions.selectAllFields'),
    align: isRTL.value ? 'end' : ' start',
    sortable: true,
    key: 'name',
  },
]);
const VERSION_REQUIRED = computed(
  () => exportFormat.value === 'csv' && !selectedVersion.value
);

watch(csvFormats, async (value) => {
  if (value === 'singleRowCSVExport') {
    await fetchFormFields(selectedVersion.value, true);
  } else {
    await fetchFormFields(selectedVersion.value);
  }
});

watch(dateRange, (value) => {
  if (!value) {
    endDate.value = moment(new Date()).format('YYYY-MM-DD');
    startDate.value = moment(new Date()).format('YYYY-MM-DD');
  }
});

watch(exportFormat, async (format) => {
  if (format === 'json') {
    selectedFormFields.value = [];
  }
});

watch(selectedVersion, async (version) => {
  await fetchFormFields(version);
});

watch(startDate, () => {
  endDate.value = moment(new Date()).format('YYYY-MM-DD');
});

onMounted(async () => {
  await formStore.fetchForm(properties.formId);

  // The formVersions don't need to be updated, but the form fields should be..
  if (form.value && Array.isArray(form.value.versions)) {
    let versions = form.value.versions;
    if (FORM_UNPUBLISHED.value) {
      versions.sort((a, b) =>
        a.version < b.version ? -1 : a.version > b.version ? 1 : 0
      );
      formVersions.value.push('');
    } else {
      versions.sort((a, b) => b.published - a.published);
    }
    formVersions.value.push(...versions.map((version) => version.version));
    selectedVersion.value = formVersions.value[0];
  }
});

async function callExport() {
  let fieldsToExport =
    selectedFormFields.value.length > 0
      ? selectedFormFields.value.map((field) => {
          return field.value;
        })
      : [''];
  // Something is changing the selected values to include undefined fields
  fieldsToExport = fieldsToExport.filter((el) => el !== undefined);
  try {
    // UTC start of selected start date...
    const from =
      dateRange.value && startDate.value
        ? moment(startDate.value, 'YYYY-MM-DD hh:mm:ss').utc().format()
        : undefined;
    // UTC end of selected end date...
    const to =
      dateRange.value && endDate.value
        ? moment(`${endDate.value} 23:59:59`, 'YYYY-MM-DD hh:mm:ss')
            .utc()
            .format()
        : undefined;

    let emailExport = false;
    if (
      (submissionList.value.length > ExportLargeData.MAX_RECORDS ||
        formFields.value.length > ExportLargeData.MAX_FIELDS) &&
      exportFormat.value !== 'json'
    ) {
      emailExport = true;
      notificationStore.addNotification({
        ...NotificationTypes.SUCCESS,
        title: t('trans.exportSubmissions.exportInProgress'),
        text: t('trans.exportSubmissions.emailSentMsg', {
          email: email.value,
        }),
        timeout: 20,
      });
    }
    const response = await formService.exportSubmissions(
      form.value.id,
      exportFormat.value,
      csvFormats.value,
      exportFormat.value === 'csv' ? selectedVersion.value : undefined,
      {
        minDate: from,
        maxDate: to,
      },
      fieldsToExport,
      emailExport,
      {
        deleted: false,
        drafts: false,
      }
    );

    if (response && response.data && !emailExport) {
      // Create a UTF-8 Byte Order Mark to handle BC Sans in Excel.
      const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

      const blob = new Blob([BOM, response.data], {
        type: response.headers['content-type'],
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = FILENAME.value;
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (response && !response.data && !emailExport) {
      throw new Error(t('trans.exportSubmissions.noResponseDataErr'));
    }
  } catch (error) {
    const data = error?.response?.data
      ? JSON.parse(await error.response.data.text())
      : undefined;
    notificationStore.addNotification({
      text: data?.detail
        ? data.detail
        : t('trans.exportSubmissions.apiCallErrorMsg'),
      consoleError:
        t('trans.exportSubmissions.apiCallConsErrorMsg') +
        `${form.value.id}: ${error}`,
    });
  }
}

async function changeVersions(version) {
  await fetchFormFields(version);
}

async function fetchFormFields(version, singleRow = false) {
  loading.value = true;
  selectedFormFields.value = [];
  if (version !== '') {
    await formStore.fetchFormCSVExportFields({
      formId: properties.formId,
      type: 'submissions',
      draft: false,
      deleted: false,
      version: version,
      singleRow: singleRow,
    });
  }
  items.value =
    formFields.value && formFields.value.length > 0
      ? formFields.value.map((ff) => ({ name: ff, value: ff }))
      : [];
  selectedFormFields.value = items.value;
  loading.value = false;
}

defineExpose({
  callExport,
  changeVersions,
  dateRange,
  endDate,
  exportFormat,
  formVersions,
  selectedFormFields,
  startDate,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-row class="mt-6" no-gutters>
      <v-col>
        <v-row>
          <v-col cols="11">
            <h1 :lang="locale">
              {{ $t('trans.exportSubmissions.exportSubmissionsToFile') }}
            </h1>
            <h3>{{ formId ? form.name : '' }}</h3>
          </v-col>
          <v-col :class="isRTL ? 'text-left' : 'text-right'" cols="1">
            <span>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <router-link
                    :to="{ name: 'FormSubmissions', query: { f: form.id } }"
                  >
                    <v-btn
                      class="mx-1"
                      color="primary"
                      icon
                      v-bind="props"
                      :title="$t('trans.exportSubmissions.viewSubmissions')"
                    >
                      <v-icon icon="mdi:mdi-list-box-outline"></v-icon>
                    </v-btn>
                  </router-link>
                </template>
                <span :lang="locale">{{
                  $t('trans.exportSubmissions.viewSubmissions')
                }}</span>
              </v-tooltip>
            </span>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <span class="subTitleObjectStyle" :lang="locale">
              {{ $t('trans.exportSubmissions.fileType') }}
            </span>
            <v-radio-group v-model="exportFormat" hide-details="auto">
              <v-radio value="json">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="locale"
                    >{{ $t('trans.exportSubmissions.json') }}</span
                  >
                </template>
              </v-radio>
              <v-radio value="csv">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="locale"
                    >{{ $t('trans.exportSubmissions.csv') }}</span
                  >
                </template>
              </v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row v-if="exportFormat === 'csv'" class="mt-5">
          <v-col>
            <div class="subTitleObjectStyle" :lang="locale">
              {{ $t('trans.exportSubmissions.formVersion') }}
            </div>
            <div v-if="VERSION_REQUIRED" class="text-red mt-3" :lang="locale">
              {{ $t('trans.exportSubmissions.versionIsRequired') }}
            </div>
            <v-select
              v-model="selectedVersion"
              item-title="id"
              item-value="version"
              :items="formVersions"
              class="mt-0"
              style="width: 25%; margin-top: 0px"
              @update:model-value="changeVersions"
            ></v-select>
          </v-col>
        </v-row>
        <v-row v-if="exportFormat === 'csv' && !FORM_UNPUBLISHED" class="mt-0">
          <v-col>
            <p class="subTitleObjectStyle" :lang="locale">
              {{ $t('trans.exportSubmissions.dataFields') }}
            </p>
            <v-row v-if="exportFormat === 'csv'">
              <v-col>
                <v-row>
                  <v-col cols="7">
                    <v-skeleton-loader type="card" :loading="loading">
                      <span
                        v-if="formFields.length === 0"
                        :class="{ 'mr-1': isRTL }"
                        :lang="locale"
                      >
                        This form version has no submissions to export.
                      </span>
                      <div v-else>
                        <v-text-field
                          v-model="formFieldsSearchFilter"
                          :placeholder="
                            $t('trans.exportSubmissions.searchFields')
                          "
                          clearable
                          color="primary"
                          prepend-inner-icon="search"
                          variant="filled"
                          density="compact"
                          class="mt-3 submissions-table"
                          single-line
                          :class="{ 'dir-rtl': isRTL, label: isRTL }"
                          :lang="locale"
                        />
                        <span
                          class="subTitleObjectStyle"
                          style="font-size: 14px !important"
                          :lang="locale"
                        >
                          {{ selectedFormFields.length }}
                          {{ $t('trans.exportSubmissions.of') }}
                          {{ formFields.length }}
                          {{ $t('trans.exportSubmissions.selectedForExports') }}
                        </span>

                        <v-data-table
                          v-model="selectedFormFields"
                          hover
                          :headers="headers"
                          :search="formFieldsSearchFilter"
                          show-select
                          hide-default-footer
                          disable-sort
                          :items="items"
                          item-value="name"
                          height="300px"
                          mobile
                          return-object
                          disable-pagination
                          fixed-header
                          class="bg-grey-lighten-5 mt-3 submissions-table"
                          :class="{ 'dir-rtl': isRTL }"
                        />
                      </div>
                    </v-skeleton-loader>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="mt-4">
          <v-col>
            <span class="subTitleObjectStyle" :lang="locale">
              {{ $t('trans.exportSubmissions.submissionDate') }}
            </span>
            <v-radio-group
              v-model="dateRange"
              cy-test="dateRange"
              hide-details="auto"
            >
              <v-radio :value="false">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="locale"
                    >{{ $t('trans.exportSubmissions.all') }}</span
                  >
                </template>
              </v-radio>
              <v-radio :value="true">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="locale"
                    >{{ $t('trans.exportSubmissions.SelectdateRange') }}</span
                  >
                </template>
              </v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row class="mt-5">
          <v-col>
            <div v-if="dateRange">
              <v-row>
                <v-col cols="12" sm="6" offset-sm="0" offset-md="1" md="4">
                  <v-text-field
                    v-model="startDate"
                    type="date"
                    :placeholder="$t('trans.date.date')"
                    append-icon="event"
                    density="compact"
                    variant="outlined"
                    :rules="startDateRules"
                    :class="{ 'dir-rtl': isRTL }"
                    :lang="locale"
                  >
                    <template #label>
                      <span :lang="locale">{{
                        $t('trans.exportSubmissions.from')
                      }}</span>
                    </template>
                  </v-text-field>
                </v-col>
                <v-col cols="12" sm="6" offset-sm="0" offset-md="1" md="4">
                  <v-text-field
                    v-model="endDate"
                    type="date"
                    :placeholder="$t('trans.date.date')"
                    append-icon="event"
                    density="compact"
                    variant="outlined"
                    :rules="endDateRules"
                    :class="{ 'dir-rtl': isRTL }"
                    :lang="locale"
                  >
                    <template #label>
                      <span :lang="locale">{{
                        $t('trans.exportSubmissions.to')
                      }}</span>
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
        <v-row
          v-if="
            exportFormat === 'csv' &&
            !loading &&
            formFields.length > 0 &&
            !FORM_UNPUBLISHED
          "
          class="mt-0 pt-0"
        >
          <v-col>
            <span class="subTitleObjectStyle mr-1" :lang="locale">
              {{ $t('trans.exportSubmissions.CSVFormat') }}
            </span>

            <v-radio-group v-model="csvFormats" hide-details="auto">
              <v-radio
                label="A"
                value="multiRowEmptySpacesCSVExport"
                style="display: flex; align-content: flex-start"
              >
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    style="display: flex; align-content: flex-start"
                    :lang="locale"
                  >
                    {{ $t('trans.exportSubmissions.multiRowPerSubmissionA') }}
                  </span>
                </template>
              </v-radio>
              <v-radio
                value="multiRowBackFilledCSVExport"
                class="mt-2"
                style="display: flex; align-content: flex-start"
              >
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="locale"
                  >
                    {{ $t('trans.exportSubmissions.multiRowPerSubmissionB') }}
                  </span>
                </template>
              </v-radio>
              <v-radio
                class="mt-2"
                value="singleRowCSVExport"
                style="display: flex; align-content: flex-start"
              >
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="locale"
                    >{{ $t('trans.exportSubmissions.singleRowPerSubmission') }}
                  </span>
                </template>
              </v-radio>
              <v-radio label="D" value="unFormattedCSVExport" class="mt-2">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    style="display: flex; align-content: flex-start"
                    :lang="locale"
                  >
                    {{ $t('trans.exportSubmissions.unformatted') }}
                  </span>
                </template>
              </v-radio>
            </v-radio-group>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <span
              :class="{ 'mr-1': isRTL }"
              class="mt-7 fileLabelStyle"
              :lang="locale"
            >
              <strong
                >{{ $t('trans.exportSubmissions.fileNameAndType') }}:</strong
              >
              <span class="ml-1">{{ FILENAME }}</span>
            </span>
          </v-col>
        </v-row>

        <v-btn
          :disabled="
            // JSON export always works so we check if it's a CSV export
            exportFormat === 'csv' &&
            // Make sure a version is selected
            ((VERSION_REQUIRED &&
              !FORM_UNPUBLISHED &&
              (!selectedVersion || selectedVersion === '')) ||
              // If it's loading then disable it
              loading ||
              // If it's not loading and there just are no form fields then disable it
              (!loading && formFields.length === 0))
          "
          class="mb-5 mt-5 exportButtonStyle"
          color="primary"
          :title="$t('trans.exportSubmissions.export')"
          @click="callExport"
        >
          <span :lang="locale">{{ $t('trans.exportSubmissions.export') }}</span>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
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
  font-size: 1.1em !important;
}
.titleObjectStyle {
  text-align: left !important;
  font-style: normal !important;
  font-size: 22px !important;
  font-weight: bold !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  letter-spacing: 0px !important;
  color: #000000 !important;
}

.subTitleObjectStyle {
  font-style: normal !important;
  font-size: 18px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  letter-spacing: 0px !important;
  color: #000000 !important;
}

.radioboxLabelStyle {
  text-align: left !important;
  font-style: normal !important;
  font-size: 14px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  letter-spacing: 0px !important;
  color: #000000 !important;
}
.fileLabelStyle {
  font-style: normal !important;
  font-size: 14px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  letter-spacing: 0px !important;
  color: #000000 !important;
}
.exportButtonStyle {
  min-width: 80px !important;
  background: #003366 0% 0% no-repeat padding-box !important;
  border: 1px solid #707070 !important;
  border-radius: 3px !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: bold !important;
  letter-spacing: 0px !important;
  color: #ffffff !important;
  text-transform: capitalize !important;
}
.cancelButtonStyle {
  width: 80px !important;
  background: #ffffff 0% 0% no-repeat padding-box !important;
  border: 1px solid #003366 !important;
  border-radius: 3px !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  letter-spacing: 0px !important;
  color: #38598a !important;
  text-transform: capitalize !important;
}
.blueColorWrapper {
  text-align: left !important;
  font-style: normal !important;
  font-size: 10px !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  letter-spacing: 0px !important;
  color: #1a5a96 !important;
  cursor: pointer;
  text-transform: capitalize !important;
}
</style>
