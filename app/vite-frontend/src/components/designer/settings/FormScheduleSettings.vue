<script setup>
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { ScheduleType } from '~/utils/constants';
import {
  getAvailableDates,
  isDateValidForMailNotification,
} from '~/utils/transformUtils';

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

const enableReminderDraw = ref(true);
const githubLinkScheduleAndReminderFeature = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification'
);

const scheduleOpenDate = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
];

const scheduleCloseDate = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
  (v) =>
    moment(v).isAfter(form.value.schedule.openSubmissionDateTime, 'day') ||
    'Close Submission date should be greater then open submission date.',
];

const roundNumber = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
    'Value must be a number. ie. 1,2,3,5,99',
];

const repeatTerm = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
    'Value must be an number. ie. 1,2,3,5,99',
];

const scheduleTypedRules = [(v) => !!v || 'Please select at least 1 option'];

const repeatIntervalType = [
  (v) => !!v || 'This field is required.',
  (v) =>
    AVAILABLE_PERIOD_OPTIONS.value.includes(v) ||
    'This should be a valid interval.',
];

const closeMessage = [(v) => !!v || 'This field is required.'];
const repeatUntilDate = [
  (v) => !!v || 'This field is required.',
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    'Date must be in correct format. ie. yyyy-mm-dd',
  (v) =>
    moment(v).isAfter(form.value.schedule.openSubmissionDateTime, 'day') ||
    'Repeat until date should be greater then open submission date.',
];

const AVAILABLE_DATES = computed(() => {
  const getDates = getAvailableDates(
    form.value.schedule.keepOpenForTerm,
    form.value.schedule.keepOpenForInterval,
    form.value.schedule.openSubmissionDateTime,
    form.value.schedule.repeatSubmission.everyTerm,
    form.value.schedule.repeatSubmission.everyIntervalType,
    form.value.schedule.allowLateSubmissions.forNext.term,
    form.value.schedule.allowLateSubmissions.forNext.intervalType,
    form.value.schedule.repeatSubmission.repeatUntil,
    form.value.schedule.scheduleType,
    form.value.schedule.closeSubmissionDateTime
  );
  return getDates;
});

const AVAILABLE_PERIOD_OPTIONS = computed(() => {
  let arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
  let diffInDays = 0;
  if (
    form.value.schedule.openSubmissionDateTime &&
    form.value.schedule.keepOpenForInterval &&
    form.value.schedule.keepOpenForTerm
  ) {
    diffInDays = moment
      .duration({
        [form.value.schedule.keepOpenForInterval]:
          form.value.schedule.keepOpenForTerm,
      })
      .asDays(); // moment.duration(this.schedule.keepOpenForTerm, this.schedule.keepOpenForInterval).days();

    if (
      form.value.schedule.allowLateSubmissions.enabled &&
      form.value.schedule.allowLateSubmissions.forNext.term &&
      form.value.schedule.allowLateSubmissions.forNext.intervalType
    ) {
      let durationoflatesubInDays = 0;
      if (
        form.value.schedule.allowLateSubmissions.forNext.intervalType === 'days'
      ) {
        durationoflatesubInDays =
          form.value.schedule.allowLateSubmissions.forNext.term;
      } else {
        durationoflatesubInDays = moment
          .duration({
            [form.value.schedule.allowLateSubmissions.forNext.intervalType]:
              form.value.schedule.allowLateSubmissions.forNext.term,
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
});

const SCHEDULE_TYPE = computed(() => ScheduleType);

function openDateTypeChanged() {
  if (
    isDateValidForMailNotification(form.value.schedule.openSubmissionDateTime)
  ) {
    enableReminderDraw.value = false;
    form.value.reminder_enabled = false;
  } else {
    enableReminderDraw.value = true;
  }
}

function repeatSubmissionChanged() {
  if (!form.value.schedule.repeatSubmission.enabled) {
    form.value.schedule.repeatSubmission.everyTerm = null;
    form.value.schedule.repeatSubmission.everyIntervalType = null;
    form.value.schedule.repeatSubmission.repeatUntil = null;
  }
}

function scheduleTypeChanged() {
  if (form.value.schedule.scheduleType === ScheduleType.MANUAL) {
    form.value.schedule.keepOpenForTerm = null;
    form.value.schedule.keepOpenForInterval = null;
    form.value.schedule.closingMessageEnabled = null;
    form.value.schedule.closingMessage = null;
    form.value.schedule.closeSubmissionDateTime = null;
    (form.value.schedule.repeatSubmission = {
      enabled: null,
      repeatUntil: null,
      everyTerm: null,
      everyIntervalType: null,
    }),
      (form.value.schedule.allowLateSubmissions = {
        enabled: null,
        forNext: {
          term: null,
          intervalType: null,
        },
      });
  }
  if (form.value.schedule.scheduleType === ScheduleType.CLOSINGDATE) {
    form.value.schedule.keepOpenForTerm = null;
    form.value.schedule.keepOpenForInterval = null;
    form.value.schedule.closingMessageEnabled = null;
    form.value.schedule.closingMessage = null;
    (form.value.schedule.repeatSubmission = {
      enabled: null,
      repeatUntil: null,
      everyTerm: null,
      everyIntervalType: null,
    }),
      (form.value.schedule.allowLateSubmissions = {
        enabled: null,
        forNext: {
          term: null,
          intervalType: null,
        },
      });
  }
  if (form.value.schedule.scheduleType === ScheduleType.PERIOD) {
    form.value.schedule.closeSubmissionDateTime = null;
    form.value.schedule.closingMessageEnabled = null;
    form.value.schedule.closingMessage = null;
    form.value.schedule.allowLateSubmissions = {
      enabled: null,
      forNext: {
        term: null,
        intervalType: null,
      },
    };
  }
}
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>{{
      $t('trans.formSettings.formScheduleSettings')
    }}</template>
    <v-row class="m-0">
      <v-col cols="8" md="8" class="pl-0 pr-0 pb-0">
        <v-text-field
          v-model="form.schedule.openSubmissionDateTime"
          type="date"
          :placeholder="$t('trans.date.date')"
          append-icon="event"
          :label="$t('trans.formSettings.opensubmissions')"
          density="compact"
          variant="outlined"
          :rules="scheduleOpenDate"
          @change="openDateTypeChanged"
        ></v-text-field>
      </v-col>

      <v-col cols="12" md="12" class="p-0">
        <p class="font-weight-black">
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
                :label="$t('trans.formSettings.keepSubmissnOpenTilUnplished')"
                :value="SCHEDULE_TYPE.MANUAL"
              />
              <v-radio
                class="mx-2"
                :label="$t('trans.formSettings.submissionsClosingDate')"
                :value="SCHEDULE_TYPE.CLOSINGDATE"
              />
              <v-radio
                class="mx-2"
                :label="$t('trans.formSettings.submissionPeriod')"
                :value="SCHEDULE_TYPE.PERIOD"
              />
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
          append-icon="event"
          :label="$t('trans.formSettings.closeSubmissions')"
          density="compact"
          variant="outlined"
          :rules="scheduleCloseDate"
        ></v-text-field>
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
        {{ $t('trans.formSettings.allowLateSubmissions') }}
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon
              color="primary"
              class="ml-3"
              v-bind="props"
              icon="mdi:mdi-help-circle-outline"
            >
            </v-icon>
          </template>
          <span>
            {{ $t('trans.formSettings.allowLateSubmissionsInfoTip') }}
          </span>
        </v-tooltip>
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
      <template #label>{{ $t('trans.formSettings.repeatPeriod') }}</template>
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
        <p class="font-weight-black m-0">
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
        >{{ $t('trans.formSettings.submissionsOpenDateRange') }}
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

        <span>{{
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
                v-bind="props"
                icon="mdi:mdi-help-circle-outline"
              ></v-icon>
            </template>
            <span>
              <!-- MORE FUTURE OCCURENCES -->
              {{ $t('trans.formSettings.datesOfSubmissnInfo') }}
              <ul>
                <li
                  v-for="date in AVAILABLE_DATES"
                  :key="date.startDate + Math.random()"
                >
                  {{ $t('trans.formSettings.formOpenInterval') }}
                  {{ date.startDate.split(' ')[0] }}
                  <span v-if="form.schedule.enabled">
                    {{ $t('trans.formSettings.to') }}
                    {{ date.closeDate.split(' ')[0] }}
                    <span
                      v-if="
                        form.schedule.allowLateSubmissions.enabled &&
                        date.closeDate !== date.graceDate
                      "
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
        (userType === 'team' &&
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
            {{ $t('trans.formSettings.customClosingMessage') }}
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon
                  color="primary"
                  class="ml-3"
                  v-bind="props"
                  icon="mdi:mdi-help-circle-outline"
                ></v-icon>
              </template>
              <span>
                {{ $t('trans.formSettings.customClosingMessageToolTip') }}
              </span>
            </v-tooltip>
          </template>
        </v-checkbox>
      </v-col>

      <v-col cols="12" md="12" class="p-0">
        <v-expand-transition v-if="form.schedule.closingMessageEnabled">
          <v-row class="mb-0 mt-0">
            <v-col class="mb-0 mt-0 pb-0 pt-0">
              <template #title>{{
                $t('trans.formSettings.closingMessage')
              }}</template>
              <v-textarea
                v-model="form.schedule.closingMessage"
                density="compact"
                rows="2"
                solid
                variant="outlined"
                :label="$t('trans.formSettings.closingMessage')"
                data-test="text-name"
                :rules="closeMessage"
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
            userType === 'team' &&
            form.schedule.scheduleType !== null &&
            enableReminderDraw &&
            form.schedule.openSubmissionDateTime
          "
        >
          <v-row class="mb-0 mt-0">
            <v-col class="mb-0 mt-0 pb-0 pt-0">
              <template #title>{{
                $t('trans.formSettings.sendReminderEmail')
              }}</template>
              <v-checkbox v-model="form.reminder_enabled" class="my-0 m-0 p-0">
                <template #label>
                  {{ $t('trans.formSettings.sendReminderEmail') }}
                  <v-tooltip close-delay="2500" location="bottom">
                    <template #activator="{ props }">
                      <v-icon
                        color="primary"
                        class="ml-3"
                        v-bind="props"
                        icon="mdi:mdi-help-circle-outline"
                      ></v-icon>
                    </template>
                    <span>
                      {{
                        $t('trans.formSettings.autoReminderNotificatnToolTip')
                      }}
                      <a
                        :href="githubLinkScheduleAndReminderFeature"
                        class="preview_info_link_field_white"
                        :target="'_blank'"
                      >
                        {{ $t('trans.formSettings.learnMore') }}
                        <v-icon
                          icon="mdi:mdi-arrow-top-right-bold-box-outline"
                        ></v-icon
                      ></a>
                    </span>
                  </v-tooltip>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-col>
    </v-row>
  </BasePanel>
</template>
