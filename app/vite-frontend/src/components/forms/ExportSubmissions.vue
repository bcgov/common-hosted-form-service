<script setup>
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import formService from '~/services/formService.js';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes, ExportLargeData } from '~/utils/constants';

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const { t } = useI18n({ useScope: 'global' });

const allDataFields = ref(true);
const csvFormats = ref('multiRowEmptySpacesCSVExport');
const dateRange = ref(false);
const dialog = ref(false);
const endDate = ref(moment(Date()).format('YYYY-MM-DD'));
const exportFormat = ref('json');
const inputFilter = ref('');
const selected = ref([]);
const showFieldsOptions = ref(false);
const startDate = ref(moment(Date()).format('YYYY-MM-DD'));
const versions = ref([]);
const versionRequired = ref(false);
const versionSelected = ref(0);

const authStore = useAuthStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { email } = storeToRefs(authStore);
const { form, formFields, submissionList } = storeToRefs(formStore);

const startDateRules = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
  (v) =>
    moment(v).isAfter(moment(Date()).format('YYYY-MM-DD'), 'day') ||
    'Start date should be greater than today.',
];
const endDateRules = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
  (v) =>
    moment(v).isAfter(startDate.value, 'day') ||
    'End date should be greater than start date.',
];
const headers = computed(() => [
  {
    title: t('trans.exportSubmissions.selectAllFields'),
    align: ' start',
    sortable: true,
    key: 'name',
  },
]);
const fileName = computed(
  () => `${form.value.snake}_submissions.${exportFormat.value}`
);
const FILTER_HEADERS = computed(() =>
  versionSelected.value !== ''
    ? formFields.value.map((f) => ({ name: f, value: f }))
    : []
);

async function changeVersions(value) {
  versionRequired.value = false;
  value !== ''
    ? (showFieldsOptions.value = true)
    : (showFieldsOptions.value = false);
  await refreshFormFields(value);
}

async function refreshFormFields(version) {
  selected.value = [];
  if (version !== '') {
    await formStore.fetchFormCSVExportFields({
      formId: properties.formId,
      type: 'submissions',
      draft: false,
      deleted: false,
      version: version,
    });
    (allDataFields.value = true), selected.value.push(...FILTER_HEADERS.value);
  }
}

async function callExport() {
  if (exportFormat.value === 'csv' && versionSelected.value === '') {
    versionRequired.value = true;
  } else {
    exportData();
  }
}

async function exportData() {
  let fieldToExport =
    selected.value.length > 0
      ? selected.value.map((field) => field.value)
      : [''];
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
      dialog.value = false;
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
      exportFormat.value === 'csv' ? versionSelected.value : undefined,
      {
        minDate: from,
        maxDate: to,
        // deleted: true,
        // drafts: true
      },
      fieldToExport,
      emailExport
    );

    if (response && response.data && !emailExport) {
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.value;
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      dialog.value = false;
    } else if (response && !response.data && !emailExport) {
      throw new Error(t('trans.exportSubmissions.noResponseDataErr'));
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.exportSubmissions.apiCallErrorMsg'),
      consoleError:
        t('trans.exportSubmissions.apiCallConsErrorMsg') +
        `${form.value.id}: ${error}`,
    });
  }
}

async function updateVersions() {
  versions.value = [];
  if (form.value && Array.isArray(form.value.versions)) {
    let vers = form.value.versions;
    const isFormNotPublished = vers.every((version) => !version.published);
    if (isFormNotPublished) {
      vers.sort((a, b) =>
        a.version < b.version ? -1 : a.version > b.version ? 1 : 0
      );
      showFieldsOptions.value = false;
      versions.value.push('');
    } else {
      showFieldsOptions.value = true;
      vers.sort((a, b) => b.published - a.published);
    }
    versions.value.push(
      ...form.value.versions.map((version) => version.version)
    );
    versionSelected.value = versions.value[0];
    await refreshFormFields(versionSelected.value);
  }
}

watch(startDate, () => {
  endDate.value = moment(Date()).format('YYYY-MM-DD');
});

watch(selected, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    allDataFields.value = selected.value.length === FILTER_HEADERS.value.length;
  }
});

watch(exportFormat, (value) => {
  if (value === 'json') {
    selected.value = [];
    versionRequired.value = false;
  }
  updateVersions();
});

watch(dateRange, (value) => {
  if (!value) {
    endDate.value = moment(Date()).format('YYYY-MM-DD');
    startDate.value = moment(Date()).format('YYYY-MM-DD');
  }
});

onMounted(() => {
  formStore.fetchForm(properties.formId);
});
</script>

<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <v-col>
        <v-row>
          <v-col cols="12" sm="6" order="2" order-sm="1">
            <h1>
              {{ $t('trans.exportSubmissions.exportSubmissionsToFile') }}
            </h1>
          </v-col>
          <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
            <span>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <router-link
                    :to="{ name: 'FormSubmissions', query: { f: form.id } }"
                  >
                    <v-btn class="mx-1" color="primary" icon v-bind="props">
                      <v-icon icon="mdi:mdi-list-box-outline"></v-icon>
                    </v-btn>
                  </router-link>
                </template>
                <span>{{ $t('trans.exportSubmissions.viewSubmissions') }}</span>
              </v-tooltip>
            </span>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-row>
              <v-col>
                <p class="subTitleObjectStyle">
                  {{ $t('trans.exportSubmissions.fileType') }}
                </p>
                <v-radio-group v-model="exportFormat" hide-details="auto">
                  <v-radio
                    :label="$t('trans.exportSubmissions.json')"
                    value="json"
                  >
                    <template #label>
                      <span class="radioboxLabelStyle">{{
                        $t('trans.exportSubmissions.json')
                      }}</span>
                    </template>
                  </v-radio>
                  <v-radio label="CSV" value="csv">
                    <template #label>
                      <span class="radioboxLabelStyle">{{
                        $t('trans.exportSubmissions.csv')
                      }}</span>
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            <v-row v-if="exportFormat === 'csv'" class="mt-5">
              <v-col cols="6">
                <div class="subTitleObjectStyle">
                  {{ $t('trans.exportSubmissions.formVersion') }}
                </div>
                <div v-if="versionRequired" class="text-red mt-3">
                  {{ $t('trans.exportSubmissions.versionIsRequired') }}
                </div>
                <v-select
                  v-model="versionSelected"
                  item-title="id"
                  item-value="version"
                  :items="versions"
                  class="mt-0"
                  style="width: 25%; margin-top: 0px"
                  @update:model-value="changeVersions"
                ></v-select>
              </v-col>
            </v-row>
            <v-row
              v-if="exportFormat === 'csv' && showFieldsOptions"
              class="mt-0"
            >
              <v-col>
                <p class="subTitleObjectStyle">
                  {{ $t('trans.exportSubmissions.dataFields') }}
                </p>
                <v-row v-if="exportFormat === 'csv'">
                  <v-col>
                    <v-row>
                      <v-col cols="7">
                        <v-text-field
                          v-model="inputFilter"
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
                        >
                        </v-text-field>
                        <div
                          class="subTitleObjectStyle"
                          style="font-size: 14px !important"
                        >
                          {{ selected.length }}
                          {{ $t('trans.exportSubmissions.of') }}
                          {{ FILTER_HEADERS.length }}
                          {{ $t('trans.exportSubmissions.selectedForExports') }}
                        </div>

                        <v-data-table
                          v-model="selected"
                          :headers="headers"
                          :search="inputFilter"
                          show-select
                          hide-default-footer
                          disable-sort
                          :items="FILTER_HEADERS"
                          item-key="name"
                          height="300px"
                          mobile
                          disable-pagination
                          fixed-header
                          class="bg-grey-lighten-5 mt-3 submissions-table"
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <v-row class="mt-4">
              <v-col>
                <p class="subTitleObjectStyle">
                  {{ $t('trans.exportSubmissions.submissionDate') }}
                </p>
                <v-radio-group v-model="dateRange" hide-details="auto">
                  <v-radio
                    :label="$t('trans.exportSubmissions.all')"
                    :value="false"
                  >
                    <template #label>
                      <span class="radioboxLabelStyle">{{
                        $t('trans.exportSubmissions.all')
                      }}</span>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="$t('trans.exportSubmissions.selectDateRange')"
                    :value="true"
                  >
                    <template #label>
                      <span class="radioboxLabelStyle">{{
                        $t('trans.exportSubmissions.SelectdateRange')
                      }}</span>
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
                        v-bind="props"
                      ></v-text-field>
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
                        v-bind="props"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>
              </v-col>
            </v-row>
            <v-row
              v-if="exportFormat === 'csv' && showFieldsOptions"
              class="mt-0 pt-0"
            >
              <v-col>
                <div style="display: flex; align-content: flex-start">
                  <div class="subTitleObjectStyle mr-1">
                    {{ $t('trans.exportSubmissions.CSVFormat') }}
                  </div>
                </div>

                <v-radio-group v-model="csvFormats" hide-details="auto">
                  <v-radio
                    label="A"
                    value="multiRowEmptySpacesCSVExport"
                    style="display: flex; align-content: flex-start"
                  >
                    <template #label>
                      <span
                        class="radioboxLabelStyle"
                        style="display: flex; align-content: flex-start"
                      >
                        {{
                          $t('trans.exportSubmissions.multiRowPerSubmissionA')
                        }}
                      </span>
                    </template>
                  </v-radio>
                  <v-radio
                    label="B"
                    value="multiRowBackFilledCSVExport"
                    class="mt-2"
                    style="display: flex; align-content: flex-start"
                  >
                    <template #label>
                      <span class="radioboxLabelStyle">
                        {{
                          $t('trans.exportSubmissions.multiRowPerSubmissionB')
                        }}
                      </span>
                    </template>
                  </v-radio>
                  <v-radio
                    label="C"
                    class="mt-2"
                    value="singleRowCSVExport"
                    style="display: flex; align-content: flex-start"
                  >
                    <template #label>
                      <span class="radioboxLabelStyle"
                        >{{
                          $t('trans.exportSubmissions.singleRowPerSubmission')
                        }}
                      </span>
                    </template>
                  </v-radio>
                  <v-radio label="D" value="unFormattedCSVExport" class="mt-2">
                    <template #label>
                      <span
                        class="radioboxLabelStyle"
                        style="display: flex; align-content: flex-start"
                      >
                        {{ $t('trans.exportSubmissions.unformatted') }}
                      </span>
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            <div class="mt-7 fileLabelStyle">
              {{ $t('trans.exportSubmissions.fileNameAndType') }}:
              <strong>{{ fileName }}</strong>
            </div>
            <v-btn
              class="mb-5 mt-5 exportButtonStyle"
              color="primary"
              @click="callExport"
            >
              <span>{{ $t('trans.exportSubmissions.export') }}</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
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
  text-align: left !important;
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
  text-align: left !important;
  font-style: normal !important;
  font-size: 14px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: bold !important;
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
