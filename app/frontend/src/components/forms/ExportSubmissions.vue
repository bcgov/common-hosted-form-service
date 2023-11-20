<script>
import moment from 'moment';
import { mapActions, mapState } from 'pinia';

import { i18n } from '~/internationalization';
import formService from '~/services/formService.js';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes, ExportLargeData } from '~/utils/constants';

export default {
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      csvFormats: 'multiRowEmptySpacesCSVExport',
      dateRange: false,
      dialog: false,
      endDate: moment(Date()).format('YYYY-MM-DD'),
      endDateRules: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          'Date must be in correct format. ie. yyyy-mm-dd',
        (v) =>
          moment(v).isAfter(this.startDate, 'day') ||
          'End date should be greater than start date.',
      ],
      exportFormat: 'json',
      inputFilter: '',
      selected: [],
      showFieldsOptions: false,
      startDate: moment(Date()).format('YYYY-MM-DD'),
      startDateRules: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          'Date must be in correct format. ie. yyyy-mm-dd',
        (v) =>
          moment(v).isBefore(moment(Date()).format('YYYY-MM-DD'), 'day') ||
          'Start date should be less than today.',
      ],
      versions: [],
      versionRequired: false,
      versionSelected: 0,
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'form',
      'formFields',
      'isRTL',
      'lang',
      'permissions',
      'submissionList',
      'userFormPreferences',
    ]),
    ...mapState(useAuthStore, ['email']),
    headers() {
      return [
        {
          title: i18n.t('trans.exportSubmissions.selectAllFields'),
          align: this.isRTL ? 'end' : ' start',
          sortable: true,
          key: 'name',
        },
      ];
    },
    fileName() {
      return `${this.form.snake}_submissions.${this.exportFormat}`;
    },
    FILTER_HEADERS() {
      return this.versionSelected !== ''
        ? this.formFields.map((f) => ({ name: f, value: f }))
        : [];
    },
  },
  watch: {
    startDate() {
      this.endDate = moment(Date()).format('YYYY-MM-DD');
    },
    async versionSelected(value) {
      this.csvFormats = 'multiRowEmptySpacesCSVExport';
      await this.refreshFormFields(value);
    },
    async exportFormat(value) {
      if (value === 'json') {
        this.selected = [];
        this.versionRequired = false;
      }
      await this.updateVersions();
    },
    async csvFormats(value) {
      if (value === 'singleRowCSVExport') {
        await this.refreshFormFields(this.versionSelected, true);
      } else {
        await this.refreshFormFields(this.versionSelected);
      }
    },
    dateRange(value) {
      if (!value) {
        this.endDate = moment(Date()).format('YYYY-MM-DD');
        this.startDate = moment(Date()).format('YYYY-MM-DD');
      }
    },
  },
  mounted() {
    this.fetchForm(this.formId);
  },
  methods: {
    ...mapActions(useFormStore, ['fetchForm', 'fetchFormCSVExportFields']),
    ...mapActions(useNotificationStore, ['addNotification']),
    async changeVersions(value) {
      this.versionRequired = false;
      value !== ''
        ? (this.showFieldsOptions = true)
        : (this.showFieldsOptions = false);
      await this.refreshFormFields(value);
    },

    async refreshFormFields(version, singleRow = false) {
      this.selected = [];
      if (version !== '') {
        await this.fetchFormCSVExportFields({
          formId: this.formId,
          type: 'submissions',
          draft: false,
          deleted: false,
          version: version,
          singleRow: singleRow,
        });
        this.selected = this.FILTER_HEADERS;
      }
    },
    async callExport() {
      if (this.exportFormat === 'csv' && this.versionSelected === '') {
        this.versionRequired = true;
      } else {
        this.exportData();
      }
    },

    async exportData() {
      let fieldToExport =
        this.selected.length > 0
          ? this.selected.map((field) => {
              return field.value;
            })
          : [''];
      // Something is changing the selected values to include undefined fields
      fieldToExport = fieldToExport.filter((el) => el !== undefined);
      try {
        // UTC start of selected start date...
        const from =
          this.dateRange && this.startDate
            ? moment(this.startDate, 'YYYY-MM-DD hh:mm:ss').utc().format()
            : undefined;
        // UTC end of selected end date...
        const to =
          this.dateRange && this.endDate
            ? moment(`${this.endDate} 23:59:59`, 'YYYY-MM-DD hh:mm:ss')
                .utc()
                .format()
            : undefined;

        let emailExport = false;
        if (
          (this.submissionList.length > ExportLargeData.MAX_RECORDS ||
            this.formFields.length > ExportLargeData.MAX_FIELDS) &&
          this.exportFormat !== 'json'
        ) {
          this.dialog = false;
          emailExport = true;
          this.addNotification({
            ...NotificationTypes.SUCCESS,
            title: i18n.t('trans.exportSubmissions.exportInProgress'),
            text: i18n.t('trans.exportSubmissions.emailSentMsg', {
              email: this.email,
            }),
            timeout: 20,
          });
        }
        const response = await formService.exportSubmissions(
          this.form.id,
          this.exportFormat,
          this.csvFormats,
          this.exportFormat === 'csv' ? this.versionSelected : undefined,
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
          a.download = this.fileName;
          a.style.display = 'none';
          a.classList.add('hiddenDownloadTextElement');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          this.dialog = false;
        } else if (response && !response.data && !emailExport) {
          throw new Error(i18n.t('trans.exportSubmissions.noResponseDataErr'));
        }
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.exportSubmissions.apiCallErrorMsg'),
          consoleError:
            i18n.t('trans.exportSubmissions.apiCallConsErrorMsg') +
            `${this.form.id}: ${error}`,
        });
      }
    },

    async updateVersions() {
      this.versions = [];
      if (this.form && Array.isArray(this.form.versions)) {
        let vers = this.form.versions;
        const isFormNotPublished = vers.every((version) => !version.published);
        if (isFormNotPublished) {
          vers.sort((a, b) =>
            a.version < b.version ? -1 : a.version > b.version ? 1 : 0
          );
          this.showFieldsOptions = false;
          this.versions.push('');
        } else {
          this.showFieldsOptions = true;
          vers.sort((a, b) => b.published - a.published);
        }
        this.versions.push(
          ...this.form.versions.map((version) => version.version)
        );
        this.versionSelected = this.versions[0];
        await this.refreshFormFields(this.versionSelected);
      }
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-row class="mt-6" no-gutters>
      <v-col>
        <v-row>
          <v-col cols="11">
            <h1 :lang="lang">
              {{ $t('trans.exportSubmissions.exportSubmissionsToFile') }}
            </h1>
          </v-col>
          <v-col :class="isRTL ? 'text-left' : 'text-right'" cols="1">
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
                <span :lang="lang">{{
                  $t('trans.exportSubmissions.viewSubmissions')
                }}</span>
              </v-tooltip>
            </span>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <span class="subTitleObjectStyle" :lang="lang">
              {{ $t('trans.exportSubmissions.fileType') }}
            </span>
            <v-radio-group v-model="exportFormat" hide-details="auto">
              <v-radio value="json">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="lang"
                    >{{ $t('trans.exportSubmissions.json') }}</span
                  >
                </template>
              </v-radio>
              <v-radio value="csv">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="lang"
                    >{{ $t('trans.exportSubmissions.csv') }}</span
                  >
                </template>
              </v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row v-if="exportFormat === 'csv'" class="mt-5">
          <v-col>
            <div class="subTitleObjectStyle" :lang="lang">
              {{ $t('trans.exportSubmissions.formVersion') }}
            </div>
            <div v-if="versionRequired" class="text-red mt-3" :lang="lang">
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
        <v-row v-if="exportFormat === 'csv' && showFieldsOptions" class="mt-0">
          <v-col>
            <p class="subTitleObjectStyle" :lang="lang">
              {{ $t('trans.exportSubmissions.dataFields') }}
            </p>
            <v-row v-if="exportFormat === 'csv'">
              <v-col>
                <v-row>
                  <v-col cols="7">
                    <v-text-field
                      v-model="inputFilter"
                      :placeholder="$t('trans.exportSubmissions.searchFields')"
                      clearable
                      color="primary"
                      prepend-inner-icon="search"
                      variant="filled"
                      density="compact"
                      class="mt-3 submissions-table"
                      single-line
                      :class="{ 'dir-rtl': isRTL, label: isRTL }"
                      :lang="lang"
                    />
                    <span
                      class="subTitleObjectStyle"
                      style="font-size: 14px !important"
                      :lang="lang"
                    >
                      {{ selected.length }}
                      {{ $t('trans.exportSubmissions.of') }}
                      {{ FILTER_HEADERS.length }}
                      {{ $t('trans.exportSubmissions.selectedForExports') }}
                    </span>

                    <v-data-table
                      v-model="selected"
                      hover
                      :headers="headers"
                      :search="inputFilter"
                      show-select
                      hide-default-footer
                      disable-sort
                      :items="FILTER_HEADERS"
                      item-value="name"
                      height="300px"
                      mobile
                      return-object
                      disable-pagination
                      fixed-header
                      class="bg-grey-lighten-5 mt-3 submissions-table"
                      :class="{ 'dir-rtl': isRTL }"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="mt-4">
          <v-col>
            <span class="subTitleObjectStyle" :lang="lang">
              {{ $t('trans.exportSubmissions.submissionDate') }}
            </span>
            <v-radio-group v-model="dateRange" hide-details="auto">
              <v-radio :value="false">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="lang"
                    >{{ $t('trans.exportSubmissions.all') }}</span
                  >
                </template>
              </v-radio>
              <v-radio :value="true">
                <template #label>
                  <span
                    :class="{ 'mr-1': isRTL }"
                    class="radioboxLabelStyle"
                    :lang="lang"
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
                    :lang="lang"
                  >
                    <template #label>
                      <span :lang="lang">{{
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
                    :lang="lang"
                  >
                    <template #label>
                      <span :lang="lang">{{
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
          v-if="exportFormat === 'csv' && showFieldsOptions"
          class="mt-0 pt-0"
        >
          <v-col>
            <span class="subTitleObjectStyle mr-1" :lang="lang">
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
                    :lang="lang"
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
                    :lang="lang"
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
                    :lang="lang"
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
                    :lang="lang"
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
              :lang="lang"
            >
              {{ $t('trans.exportSubmissions.fileNameAndType') }}:
              <strong>{{ fileName }}</strong>
            </span>
          </v-col>
        </v-row>

        <v-btn
          class="mb-5 mt-5 exportButtonStyle"
          color="primary"
          @click="callExport"
        >
          <span :lang="lang">{{ $t('trans.exportSubmissions.export') }}</span>
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
