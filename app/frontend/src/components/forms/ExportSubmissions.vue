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
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <router-link
                    :to="{ name: 'FormSubmissions', query: { f: form.id } }"
                  >
                    <v-btn
                      class="mx-1"
                      color="primary"
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon class="mr-1">list_alt</v-icon>
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
                    <template v-slot:label>
                      <span class="radioboxLabelStyle">{{
                        $t('trans.exportSubmissions.json')
                      }}</span>
                    </template>
                  </v-radio>
                  <v-radio label="CSV" value="csv">
                    <template v-slot:label>
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
                <div class="red--text mt-3" v-if="versionRequired">
                  {{ $t('trans.exportSubmissions.versionIsRequired') }}
                </div>
                <v-select
                  item-text="id"
                  item-value="version"
                  v-model="versionSelected"
                  :items="versions"
                  @change="changeVersions"
                  class="mt-0"
                  style="width: 25%; margin-top: 0px"
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
                          filled
                          dense
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
                          :headers="headers"
                          :search="inputFilter"
                          show-select
                          hide-default-footer
                          v-model="selected"
                          disable-sort
                          :items="FILTER_HEADERS"
                          item-key="name"
                          height="300px"
                          mobile
                          disable-pagination
                          fixed-header
                          class="grey lighten-5 mt-3 submissions-table"
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
                    :label="this.$t('trans.exportSubmissions.all')"
                    :value="false"
                  >
                    <template v-slot:label>
                      <span class="radioboxLabelStyle">{{
                        $t('trans.exportSubmissions.all')
                      }}</span>
                    </template>
                  </v-radio>
                  <v-radio
                    :label="$t('trans.exportSubmissions.selectDateRange')"
                    :value="true"
                  >
                    <template v-slot:label>
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
                      <v-menu
                        v-model="startDateMenu"
                        data-test="menu-form-startDate"
                        :close-on-content-click="true"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        min-width="290px"
                      >
                        <template v-slot:activator="{ on }">
                          <label>{{
                            $t('trans.exportSubmissions.from')
                          }}</label>
                          <v-text-field
                            v-model="startDate"
                            :placeholder="$t('trans.date.date')"
                            append-icon="event"
                            v-on:click:append="startDateMenu = true"
                            readonly
                            v-on="on"
                            dense
                            outlined
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="startDate"
                          data-test="picker-form-startDate"
                          @input="startDateMenu = false"
                          :max="maxDate"
                        ></v-date-picker>
                      </v-menu>
                    </v-col>
                    <v-col cols="12" sm="6" offset-sm="0" offset-md="1" md="4">
                      <v-menu
                        v-model="endDateMenu"
                        data-test="menu-form-endDate"
                        :close-on-content-click="true"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        min-width="290px"
                      >
                        <template v-slot:activator="{ on }">
                          <label>{{ $t('trans.exportSubmissions.to') }}</label>
                          <v-text-field
                            v-model="endDate"
                            :placeholder="$t('trans.date.date')"
                            append-icon="event"
                            v-on:click:append="endDateMenu = true"
                            readonly
                            v-on="on"
                            dense
                            outlined
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="endDate"
                          data-test="picker-form-endDate"
                          @input="endDateMenu = false"
                          :min="startDate"
                        ></v-date-picker>
                      </v-menu>
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
                    <template v-slot:label>
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
                    <template v-slot:label>
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
                    <template v-slot:label>
                      <span class="radioboxLabelStyle"
                        >{{
                          $t('trans.exportSubmissions.singleRowPerSubmission')
                        }}
                      </span>
                    </template>
                  </v-radio>
                  <v-radio label="D" value="unFormattedCSVExport" class="mt-2">
                    <template v-slot:label>
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

<script>
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import formService from '@/services/formService.js';
import { NotificationTypes, ExportLargeData } from '@/utils/constants';

import {
  faXmark,
  faSquareArrowUpRight,
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faXmark, faSquareArrowUpRight);

export default {
  name: 'ExportSubmissions',
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      githubLink:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Submission-to-CSV-Export',
      dateRange: false,
      dialog: false,
      endDate: moment(Date()).format('YYYY-MM-DD'),
      endDateMenu: false,
      dataFields: false,
      exportFormat: 'json',
      startDate: moment(Date()).format('YYYY-MM-DD'),
      startDateMenu: false,
      versionSelected: 0,
      versionSelectedId: '',
      csvFormats: 'multiRowEmptySpacesCSVExport',
      versions: [],
      allDataFields: true,
      inputFilter: '',
      singleSelect: false,
      showFieldsOptions: false,
      selected: [],
      versionRequired: false,
    };
  },
  computed: {
    maxDate() {
      let momentObj = moment(Date());
      let momentString = momentObj.format('YYYY-MM-DD');
      return momentString;
    },

    headers() {
      return [
        {
          text: this.$t('trans.exportSubmissions.selectAllFields'),
          align: ' start',
          sortable: true,
          value: 'name',
        },
      ];
    },
    ...mapGetters('form', [
      'form',
      'userFormPreferences',
      'permissions',
      'formFields',
      'submissionList',
    ]),

    ...mapGetters('auth', ['email']),
    fileName() {
      return `${this.form.snake}_submissions.${this.exportFormat}`;
    },
    FILTER_HEADERS() {
      if (this.versionSelected !== '') {
        return this.formFields.map((field) => ({
          name: field,
          value: field,
        }));
      }
      return [];
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', ['fetchForm', 'fetchFormCSVExportFields']),
    async changeVersions(value) {
      this.versionRequired = false;
      value !== ''
        ? (this.showFieldsOptions = true)
        : (this.showFieldsOptions = false);
      await this.refreshFormFields(value);
    },
    async refreshFormFields(version) {
      this.selected = [];
      if (version !== '') {
        await this.fetchFormCSVExportFields({
          formId: this.formId,
          type: 'submissions',
          draft: false,
          deleted: false,
          version: version,
        });
        (this.allDataFields = true), this.selected.push(...this.FILTER_HEADERS);
      }
    },
    async callExport() {
      if (this.exportFormat === 'csv' && this.versionSelected === '') {
        this.versionRequired = true;
      } else {
        this.export();
      }
    },
    async export() {
      let fieldToExport =
        this.selected.length > 0
          ? this.selected.map((field) => field.value)
          : [''];
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
            title: this.$t('trans.exportSubmissions.exportInProgress'),
            message: this.$t('trans.exportSubmissions.emailSentMsg', {
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
          throw new Error(this.$t('trans.exportSubmissions.noResponseDataErr'));
        }
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.exportSubmissions.apiCallErrorMsg'),
          consoleError:
            this.$t('trans.exportSubmissions.apiCallConsErrorMsg') +
            `${this.form.id}: ${error}`,
        });
      }
    },

    async updateVersions() {
      this.versions = [];
      if (this.form && Array.isArray(this.form.versions)) {
        let versions = this.form.versions;
        const isFormNotPublished = versions.every(
          (version) => !version.published
        );
        if (isFormNotPublished) {
          versions.sort((a, b) =>
            a.version < b.version ? -1 : a.version > b.version ? 1 : 0
          );
          this.showFieldsOptions = false;
          this.versions.push('');
        } else {
          this.showFieldsOptions = true;
          versions.sort((a, b) => b.published - a.published);
        }
        this.versions.push(
          ...this.form.versions.map((version) => version.version)
        );
        this.versionSelected = this.versions[0];
        await this.refreshFormFields(this.versionSelected);
      }
    },
  },
  async mounted() {
    this.fetchForm(this.formId);
  },
  watch: {
    startDate() {
      this.endDate = moment(Date()).format('YYYY-MM-DD');
    },
    selected(oldValue, newValue) {
      if (oldValue !== newValue) {
        if (this.selected.length === this.FILTER_HEADERS.length) {
          this.allDataFields = true;
        } else {
          this.allDataFields = false;
        }
      }
    },
    exportFormat(value) {
      if (value === 'json') {
        this.selected = [];
        this.versionRequired = false;
      }
      this.updateVersions();
    },
    dateRange(value) {
      if (!value) {
        this.endDate = moment(Date()).format('YYYY-MM-DD');
        this.startDate = moment(Date()).format('YYYY-MM-DD');
      }
    },
  },
};
</script>

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
