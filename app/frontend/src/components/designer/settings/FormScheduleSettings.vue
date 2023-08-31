<script>
import moment from 'moment';
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { ScheduleType } from '~/utils/constants';
import {
  getAvailableDates,
  isDateValidForMailNotification,
} from '~/utils/transformUtils';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      enableReminderDraw: true,
      githubLinkScheduleAndReminderFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification',
      intervalType: [(v) => !!v || this.$t('trans.formSettings.fieldRequired')],
      scheduleOpenDate: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          this.$t('trans.formSettings.correctDateFormat'),
      ],
      scheduleCloseDate: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          this.$t('trans.formSettings.correctDateFormat'),
        (v) =>
          moment(v).isAfter(this.form.schedule.openSubmissionDateTime, 'day') ||
          this.$t('trans.formSettings.dateDiffMsg'),
      ],
      roundNumber: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
          this.$t('trans.formSettings.valueMustBeNumber'),
      ],
      repeatTerm: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
          this.$t('trans.formSettings.valueMustBeNumber'),
      ],
      scheduleTypedRules: [
        (v) => !!v || this.$t('trans.formSettings.selectAnOptions'),
      ],
      repeatIntervalType: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          this.AVAILABLE_PERIOD_OPTIONS.includes(v) ||
          this.$t('trans.formSettings.validInterval'),
      ],
      closeMessage: [(v) => !!v || this.$t('trans.formSettings.fieldRequired')],
      repeatUntilDate: [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          this.$t('trans.formSettings.correctDateFormat'),
        (v) =>
          moment(v).isAfter(this.form.schedule.openSubmissionDateTime, 'day') ||
          this.$t('trans.formSettings.dateGrtOpenSubmissnDate'),
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),

    AVAILABLE_DATES() {
      const getDates = getAvailableDates(
        this.form.schedule.keepOpenForTerm,
        this.form.schedule.keepOpenForInterval,
        this.form.schedule.openSubmissionDateTime,
        this.form.schedule.repeatSubmission.everyTerm,
        this.form.schedule.repeatSubmission.everyIntervalType,
        this.form.schedule.allowLateSubmissions.forNext.term,
        this.form.schedule.allowLateSubmissions.forNext.intervalType,
        this.form.schedule.repeatSubmission.repeatUntil,
        this.form.schedule.scheduleType,
        this.form.schedule.closeSubmissionDateTime
      );
      return getDates;
    },
    AVAILABLE_PERIOD_OPTIONS() {
      let arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
      let diffInDays = 0;
      if (
        this.form.schedule.openSubmissionDateTime &&
        this.form.schedule.keepOpenForInterval &&
        this.form.schedule.keepOpenForTerm
      ) {
        diffInDays = moment
          .duration({
            [this.form.schedule.keepOpenForInterval]:
              this.form.schedule.keepOpenForTerm,
          })
          .asDays(); // moment.duration(this.schedule.keepOpenForTerm, this.schedule.keepOpenForInterval).days();

        if (
          this.form.schedule.allowLateSubmissions.enabled &&
          this.form.schedule.allowLateSubmissions.forNext.term &&
          this.form.schedule.allowLateSubmissions.forNext.intervalType
        ) {
          let durationoflatesubInDays = 0;
          if (
            this.form.schedule.allowLateSubmissions.forNext.intervalType ===
            'days'
          ) {
            durationoflatesubInDays =
              this.form.schedule.allowLateSubmissions.forNext.term;
          } else {
            durationoflatesubInDays = moment
              .duration({
                [this.form.schedule.allowLateSubmissions.forNext.intervalType]:
                  this.form.schedule.allowLateSubmissions.forNext.term,
              })
              .asDays();
          }

          diffInDays = Number(diffInDays) + Number(durationoflatesubInDays);
        }
      }

      switch (true) {
        case diffInDays > 7 && diffInDays <= 30:
          arrayOfOption = ['months', 'quarters', 'years'];
          break;

        case diffInDays > 30 && diffInDays <= 91:
          arrayOfOption = ['quarters', 'years'];
          break;

        case diffInDays > 91:
          arrayOfOption = ['years'];
          break;

        default:
          arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
          break;
      }
      return arrayOfOption;
    },

    SCHEDULE_TYPE() {
      return ScheduleType;
    },
  },
  methods: {
    openDateTypeChanged() {
      if (
        isDateValidForMailNotification(
          this.form.schedule.openSubmissionDateTime
        )
      ) {
        this.enableReminderDraw = false;
        this.form.reminder_enabled = false;
      } else {
        this.enableReminderDraw = true;
      }
    },

    repeatSubmissionChanged() {
      if (!this.form.schedule.repeatSubmission.enabled) {
        this.form.schedule.repeatSubmission.everyTerm = null;
        this.form.schedule.repeatSubmission.everyIntervalType = null;
        this.form.schedule.repeatSubmission.repeatUntil = null;
      }
    },

    scheduleTypeChanged() {
      if (this.form.schedule.scheduleType === ScheduleType.MANUAL) {
        this.form.schedule.keepOpenForTerm = null;
        this.form.schedule.keepOpenForInterval = null;
        this.form.schedule.closingMessageEnabled = null;
        this.form.schedule.closingMessage = null;
        this.form.schedule.closeSubmissionDateTime = null;
        (this.form.schedule.repeatSubmission = {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        }),
          (this.form.schedule.allowLateSubmissions = {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          });
      }
      if (this.form.schedule.scheduleType === ScheduleType.CLOSINGDATE) {
        this.form.schedule.keepOpenForTerm = null;
        this.form.schedule.keepOpenForInterval = null;
        this.form.schedule.closingMessageEnabled = null;
        this.form.schedule.closingMessage = null;
        (this.form.schedule.repeatSubmission = {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        }),
          (this.form.schedule.allowLateSubmissions = {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          });
      }
      if (this.form.schedule.scheduleType === ScheduleType.PERIOD) {
        this.form.schedule.closeSubmissionDateTime = null;
        this.form.schedule.closingMessageEnabled = null;
        this.form.schedule.closingMessage = null;
        this.form.schedule.allowLateSubmissions = {
          enabled: null,
          forNext: {
            term: null,
            intervalType: null,
          },
        };
      }
    },
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">
        {{ $t('trans.formSettings.formScheduleSettings') }}</span
      ></template
    >
    <v-row class="m-0">
      <v-col cols="8" md="8" class="pl-0 pr-0 pb-0">
        <v-text-field
          v-model="form.schedule.openSubmissionDateTime"
          type="date"
          :placeholder="$t('trans.date.date')"
          :label="$t('trans.formSettings.opensubmissions')"
          density="compact"
          variant="outlined"
          :rules="scheduleOpenDate"
          :lang="lang"
          @change="openDateTypeChanged"
        >
          <template v-if="isRTL" #prepend-inner>
            <v-icon icon="mdi:mdi-calendar"></v-icon>
          </template>
          <template v-if="!isRTL" #append>
            <v-icon icon="mdi:mdi-calendar"></v-icon>
          </template>
        </v-text-field>
      </v-col>

      <v-col cols="12" md="12" class="p-0">
        <p class="font-weight-black" :lang="lang">
          {{ $t('trans.formSettings.submissionsDeadline') }}
        </p>
        <v-expand-transition>
          <v-row>
            <v-radio-group
              v-model="form.schedule.scheduleType"
              class="my-0"
              :rules="scheduleTypedRules"
              @update:modelValue="scheduleTypeChanged"
            >
              <v-radio
                class="mx-2"
                :class="{ 'mr-2': isRTL }"
                :value="SCHEDULE_TYPE.MANUAL"
              >
                <template #label>
                  <span :class="{ 'mr-2': isRTL }" :lang="lang"
                    >{{ $t('trans.formSettings.keepSubmissnOpenTilUnplished') }}
                  </span>
                </template>
              </v-radio>
              <v-radio
                class="mx-2"
                :class="{ 'mr-2': isRTL }"
                :value="SCHEDULE_TYPE.CLOSINGDATE"
              >
                <template #label>
                  <span :class="{ 'mr-2': isRTL }" :lang="lang"
                    >{{ $t('trans.formSettings.submissionsClosingDate') }}
                  </span>
                </template>
              </v-radio>
              <v-radio
                class="mx-2"
                :class="{ 'mr-2': isRTL }"
                :value="SCHEDULE_TYPE.PERIOD"
              >
                <template #label>
                  <span :class="{ 'mr-2': isRTL }" :lang="lang"
                    >{{ $t('trans.formSettings.submissionPeriod') }}
                  </span>
                </template>
              </v-radio>
            </v-radio-group>
          </v-row>
        </v-expand-transition>
      </v-col>

      <v-col
        v-if="form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
        cols="8"
        md="8"
        class="pl-0 pr-0 pb-0"
      >
        <v-text-field
          v-model="form.schedule.closeSubmissionDateTime"
          type="date"
          :placeholder="$t('trans.date.date')"
          :label="$t('trans.formSettings.closeSubmissions')"
          density="compact"
          variant="outlined"
          :rules="scheduleCloseDate"
        >
          <template v-if="isRTL" #prepend-inner>
            <v-icon icon="mdi:mdi-calendar"></v-icon>
          </template>
          <template v-if="!isRTL" #append>
            <v-icon icon="mdi:mdi-calendar"></v-icon>
          </template>
        </v-text-field>
      </v-col>

      <v-col
        v-if="form.schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
        cols="4"
        md="4"
        class="pl-0 pr-0 pb-0"
      >
        <v-text-field
          v-model="form.schedule.keepOpenForTerm"
          :label="$t('trans.formSettings.keepOpenFor')"
          type="number"
          density="compact"
          solid
          variant="outlined"
          class="m-0 p-0"
          :class="{ 'dir-rtl': isRTL }"
          :lang="lang"
          :rules="roundNumber"
        ></v-text-field>
      </v-col>

      <v-col
        v-if="form.schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
        cols="4"
        md="4"
        class="pl-0 pr-0 pb-0"
      >
        <v-select
          v-model="form.schedule.keepOpenForInterval"
          :items="['days', 'weeks', 'months', 'quarters', 'years']"
          :label="$t('trans.formSettings.period')"
          density="compact"
          solid
          variant="outlined"
          class="mr-2 pl-2"
          :rules="intervalType"
          :lang="lang"
        ></v-select>
      </v-col>
    </v-row>

    <v-checkbox
      v-if="
        [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
          form.schedule.scheduleType
        )
      "
      v-model="form.schedule.allowLateSubmissions.enabled"
      class="my-0 m-0 p-0"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="lang">
            {{ $t('trans.formSettings.allowLateSubmissions') }}
          </span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-help-circle-outline"
              >
              </v-icon>
            </template>
            <span :lang="lang">
              {{ $t('trans.formSettings.allowLateSubmissionsInfoTip') }}
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-expand-transition
      v-if="
        form.schedule.allowLateSubmissions.enabled &&
        [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
          form.schedule.scheduleType
        )
      "
      class="pl-3"
    >
      <v-row class="m-0">
        <v-col cols="4" md="4" class="m-0 p-0">
          <v-text-field
            v-model="form.schedule.allowLateSubmissions.forNext.term"
            :label="$t('trans.formSettings.afterCloseDateFor')"
            type="number"
            density="compact"
            solid
            variant="outlined"
            class="m-0 p-0"
            :class="{ 'dir-rtl': isRTL }"
            :lang="lang"
            :rules="roundNumber"
          >
          </v-text-field>
        </v-col>
        <v-col cols="4" md="4" class="m-0 p-0">
          <v-select
            v-model="form.schedule.allowLateSubmissions.forNext.intervalType"
            :items="['days', 'weeks', 'months', 'quarters', 'years']"
            :label="$t('trans.formSettings.period')"
            density="compact"
            solid
            variant="outlined"
            class="mr-1 pl-2"
            :rules="intervalType"
            :lang="lang"
          ></v-select>
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-checkbox
      v-if="form.schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
      v-model="form.schedule.repeatSubmission.enabled"
      class="my-0 pt-0"
      @update:modelValue="repeatSubmissionChanged"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="lang">
          {{ $t('trans.formSettings.repeatPeriod') }}
        </span>
      </template>
    </v-checkbox>

    <v-expand-transition
      v-if="
        form.schedule.scheduleType === SCHEDULE_TYPE.PERIOD &&
        form.schedule.repeatSubmission.enabled
      "
    >
      <v-row class="m-0">
        <v-col cols="4" class="m-0 p-0">
          <v-text-field
            v-model="form.schedule.repeatSubmission.everyTerm"
            :label="$t('trans.formSettings.every')"
            type="number"
            density="compact"
            solid
            variant="outlined"
            class="m-0 p-0"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            :lang="lang"
            :rules="repeatTerm"
          ></v-text-field>
        </v-col>

        <v-col cols="4" class="m-0 p-0">
          <v-select
            v-model="form.schedule.repeatSubmission.everyIntervalType"
            :items="AVAILABLE_PERIOD_OPTIONS"
            :label="$t('trans.formSettings.period')"
            density="compact"
            solid
            variant="outlined"
            class="mr-2 pl-2"
            :rules="repeatIntervalType"
            :lang="lang"
          ></v-select>
        </v-col>

        <v-col cols="4" class="m-0 p-0">
          <v-text-field
            v-model="form.schedule.repeatSubmission.repeatUntil"
            type="date"
            :placeholder="$t('trans.date.date')"
            append-icon="event"
            :label="$t('trans.formSettings.repeatUntil')"
            density="compact"
            variant="outlined"
            :rules="repeatUntilDate"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            :lang="lang"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-row
      v-if="
        form.schedule.enabled &&
        form.schedule.openSubmissionDateTime &&
        form.schedule.openSubmissionDateTime.length &&
        (form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
          ? form.schedule.closeSubmissionDateTime &&
            form.schedule.closeSubmissionDateTime.length
          : true) &&
        [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
          form.schedule.scheduleType
        )
      "
      class="p-0 m-0"
    >
      <v-col class="p-0 m-0" cols="12" md="12">
        <p class="font-weight-black m-0" :lang="lang">
          {{ $t('trans.formSettings.summary') }}
        </p>
      </v-col>

      <v-col
        v-if="
          form.schedule.openSubmissionDateTime &&
          form.schedule.openSubmissionDateTime.length
        "
        class="p-0 m-0"
        cols="12"
        md="12"
      >
        <span :lang="lang">
          {{ $t('trans.formSettings.submissionsOpenDateRange') }}
          <b>{{ form.schedule.openSubmissionDateTime }}</b>
          {{ $t('trans.formSettings.to') }}
          <b>
            {{
              form.schedule.scheduleType === SCHEDULE_TYPE.PERIOD
                ? AVAILABLE_DATES &&
                  AVAILABLE_DATES[0] &&
                  AVAILABLE_DATES[0]['closeDate'] &&
                  AVAILABLE_DATES[0]['closeDate'].split(' ')[0]
                : ''
            }}

            {{
              form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
                ? form.schedule.closeSubmissionDateTime
                : ''
            }}
          </b>
        </span>

        <span :lang="lang">{{
          form.schedule.allowLateSubmissions.enabled &&
          form.schedule.allowLateSubmissions.forNext.intervalType &&
          form.schedule.allowLateSubmissions.forNext.term
            ? $t('trans.formSettings.allowLateSubmissnInterval') +
              form.schedule.allowLateSubmissions.forNext.term +
              ' ' +
              form.schedule.allowLateSubmissions.forNext.intervalType +
              '.'
            : '. '
        }}</span>

        <span
          v-if="
            form.schedule.scheduleType === SCHEDULE_TYPE.PERIOD &&
            form.schedule.repeatSubmission.enabled === true &&
            form.schedule.repeatSubmission.everyTerm &&
            form.schedule.repeatSubmission.repeatUntil &&
            form.schedule.repeatSubmission.everyIntervalType &&
            AVAILABLE_DATES[1]
          "
          :lang="lang"
          >{{ $t('trans.formSettings.scheduleRepetition') }}
          <b>{{ form.schedule.repeatSubmission.everyTerm }} </b>
          <b>{{ form.schedule.repeatSubmission.everyIntervalType }}</b>
          {{ $t('trans.formSettings.until') }}
          <b>{{ form.schedule.repeatSubmission.repeatUntil }}</b
          >.
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-help-circle-outline"
              ></v-icon>
            </template>
            <span :lang="lang">
              <!-- MORE FUTURE OCCURENCES -->
              {{ $t('trans.formSettings.datesOfSubmissnInfo') }}
              <ul>
                <li
                  v-for="date in AVAILABLE_DATES"
                  :key="date.startDate + Math.random()"
                  :lang="lang"
                >
                  {{ $t('trans.formSettings.formOpenInterval') }}
                  {{ date.startDate.split(' ')[0] }}
                  <span v-if="form.schedule.enabled" :lang="lang">
                    {{ $t('trans.formSettings.to') }}
                    {{ date.closeDate.split(' ')[0] }}
                    <span
                      v-if="
                        form.schedule.allowLateSubmissions.enabled &&
                        date.closeDate !== date.graceDate
                      "
                      :lang="lang"
                      >{{ $t('trans.formSettings.allowDateSubmissionDate') }}
                      {{ date.graceDate.split(' ')[0] }}</span
                    ></span
                  >
                </li>
              </ul>
            </span>
          </v-tooltip>
        </span>
      </v-col>
    </v-row>

    <hr
      v-if="
        [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
          form.schedule.scheduleType
        ) ||
        (form.userType === 'team' &&
          form.schedule.scheduleType !== null &&
          enableReminderDraw &&
          form.schedule.openSubmissionDateTime)
      "
    />

    <v-row
      v-if="
        [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
          form.schedule.scheduleType
        )
      "
      class="p-0 m-0"
    >
      <v-col cols="12" md="12" class="p-0">
        <v-checkbox
          v-model="form.schedule.closingMessageEnabled"
          class="my-0 pt-0"
        >
          <template #label>
            <div>
              <span :class="{ 'mr-2': isRTL }" :lang="lang">
                {{ $t('trans.formSettings.customClosingMessage') }}
              </span>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-icon
                    color="primary"
                    class="ml-3"
                    :class="{ 'mr-2': isRTL }"
                    v-bind="props"
                    icon="mdi:mdi-help-circle-outline"
                  ></v-icon>
                </template>
                <span :lang="lang">
                  {{ $t('trans.formSettings.customClosingMessageToolTip') }}
                </span>
              </v-tooltip>
            </div>
          </template>
        </v-checkbox>
      </v-col>

      <v-col cols="12" md="12" class="p-0">
        <v-expand-transition v-if="form.schedule.closingMessageEnabled">
          <v-row class="mb-0 mt-0">
            <v-col class="mb-0 mt-0 pb-0 pt-0">
              <template #title
                ><span :lang="lang">
                  {{ $t('trans.formSettings.closingMessage') }}</span
                ></template
              >
              <v-textarea
                v-model="form.schedule.closingMessage"
                density="compact"
                rows="2"
                solid
                variant="outlined"
                :label="$t('trans.formSettings.closingMessage')"
                data-test="text-name"
                :rules="closeMessage"
                :class="{ 'dir-rtl': isRTL, label: isRTL }"
                :lang="lang"
              />
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-col>
    </v-row>

    <v-row class="p-0 m-0">
      <v-col cols="12" md="12" class="p-0">
        <v-expand-transition
          v-if="
            form.userType === 'team' &&
            form.schedule.scheduleType !== null &&
            enableReminderDraw &&
            form.schedule.openSubmissionDateTime
          "
        >
          <v-row class="mb-0 mt-0">
            <v-col class="mb-0 mt-0 pb-0 pt-0">
              <template #title
                ><span :lang="lang">{{
                  $t('trans.formSettings.sendReminderEmail')
                }}</span></template
              >
              <v-checkbox v-model="form.reminder_enabled" class="my-0 m-0 p-0">
                <template #label>
                  <div :class="{ 'mr-2': isRTL }">
                    <span :lang="lang">
                      {{ $t('trans.formSettings.sendReminderEmail') }}
                    </span>
                    <v-tooltip close-delay="2500" location="bottom">
                      <template #activator="{ props }">
                        <v-icon
                          color="primary"
                          class="ml-3"
                          v-bind="props"
                          icon="mdi:mdi-help-circle-outline"
                          :class="{ 'mr-2': isRTL }"
                        ></v-icon>
                      </template>
                      <span :lang="lang">
                        {{
                          $t('trans.formSettings.autoReminderNotificatnToolTip')
                        }}
                        <a
                          :href="githubLinkScheduleAndReminderFeature"
                          class="preview_info_link_field_white"
                          :target="'_blank'"
                          :hreflang="lang"
                        >
                          {{ $t('trans.formSettings.learnMore') }}
                          <v-icon
                            icon="mdi:mdi-arrow-top-right-bold-box-outline"
                          ></v-icon
                        ></a>
                      </span>
                    </v-tooltip>
                  </div>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-col>
    </v-row>
  </BasePanel>
</template>
