<script setup>
import moment from 'moment-timezone';
import { storeToRefs } from 'pinia';
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { ScheduleType } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

// Timezone setup
const timezone = ref(moment.tz.guess(true));
const timezoneOptions = computed(() => moment.tz.zonesForCountry('CA'));
const githubLinkScheduleAndReminderFeature = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Schedule-and-Reminder-notification/'
);
/* c8 ignore start */
const intervalType = ref([(v) => !!v || t('trans.formSettings.fieldRequired')]);
const scheduleOpenDate = ref([
  (v) => !!v || t('trans.formSettings.fieldRequired'),
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    t('trans.formSettings.correctDateFormat'),
]);
const scheduleCloseDate = ref([
  (v) => !!v || t('trans.formSettings.fieldRequired'),
  (v) =>
    (v &&
      new RegExp(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
      ).test(v)) ||
    t('trans.formSettings.correctDateFormat'),
  (v) => {
    // If dates are different, ensure close date is after open date
    if (v !== form.value.schedule.openSubmissionDateTime) {
      // Use timezone for consistent comparison
      return (
        moment
          .tz(v, 'YYYY-MM-DD', timezone.value)
          .isAfter(
            moment.tz(
              form.value.schedule.openSubmissionDateTime,
              'YYYY-MM-DD',
              timezone.value
            )
          ) || t('trans.formSettings.dateDiffMsg')
      );
    }

    // If same day, ensure close time is after open time
    return (
      moment(form.value.schedule.closeSubmissionTime, 'HH:mm').isAfter(
        moment(form.value.schedule.openSubmissionTime, 'HH:mm')
      ) || t('trans.formSettings.dateDiffMsg')
    );
  },
]);
const roundNumber = ref([
  (v) => !!v || t('trans.formSettings.fieldRequired'),
  (v) =>
    (v && new RegExp(/^[1-9]\d{0,2}$/g).test(v)) ||
    t('trans.formSettings.valueMustBeNumber'),
]);
const scheduleTypedRules = ref([
  (v) => !!v || t('trans.formSettings.selectAnOptions'),
]);

const handleIntegerInput = (event) => {
  // Prevent decimal point, negative signs, plus signs, and scientific notation
  if (
    event.key === '.' ||
    event.key === '-' ||
    event.key === '+' ||
    event.key === 'e' ||
    event.key === 'E'
  ) {
    event.preventDefault();
  }
};
const closeMessage = ref([(v) => !!v || t('trans.formSettings.fieldRequired')]);
/* c8 ignore stop */

const { form, isRTL } = storeToRefs(useFormStore());

const SCHEDULE_TYPE = computed(() => ScheduleType);

// Computed property for checking if open date is in the future
const isOpenDateInFuture = computed(() => {
  if (!form.value.schedule.openSubmissionDateTime) return false;

  const formDate = moment.tz(
    form.value.schedule.openSubmissionDateTime,
    'YYYY-MM-DD',
    timezone.value
  );
  const now = moment().tz(timezone.value);

  return now.isBefore(formDate, 'day');
});

// Simplified timezone function
function saveTimezone() {
  form.value.schedule.timezone = timezone.value;
}

// Format date for summary display with timezone awareness
function formatDateForSummary(dateStr, timeStr) {
  if (!dateStr) return '';

  const dateTime = moment.tz(
    `${dateStr} ${timeStr || '00:00'}`,
    'YYYY-MM-DD HH:mm',
    timezone.value
  );

  return dateTime.format('MMMM D, YYYY [at] h:mm A');
}

// Setup initialization on component mount
onMounted(() => {
  // Check if it's a new schedule
  const isNewSchedule = !form.value.schedule.scheduleType;

  // Set default times for new schedules
  if (isNewSchedule) {
    const today = moment().format('YYYY-MM-DD');
    form.value.schedule.openSubmissionDateTime = today;
    form.value.schedule.openSubmissionTime = '08:30';
    const oneWeekLater = moment().add(7, 'days').format('YYYY-MM-DD');
    form.value.schedule.closeSubmissionDateTime = oneWeekLater;
    form.value.schedule.closeSubmissionTime = '16:00';
  } else {
    // For existing schedules, ensure times have defaults
    if (!form.value.schedule.openSubmissionTime) {
      form.value.schedule.openSubmissionTime = '00:00';
    }
    if (!form.value.schedule.closeSubmissionTime) {
      form.value.schedule.closeSubmissionTime = '23:59';
    }
  }

  // Initialize timezone if not set
  if (!form.value.schedule.timezone) {
    form.value.schedule.timezone = timezone.value;
  } else {
    // Sync the component's timezone with the form's timezone
    timezone.value = form.value.schedule.timezone;
  }

  // Disable reminders if open date is in the past
  if (!isOpenDateInFuture.value && form.value.reminder_enabled) {
    form.value.reminder_enabled = false;
  }
});

// Watch for timezone changes
watch(
  () => timezone.value,
  () => {
    saveTimezone();
  }
);

// Watch for schedule type changes to initialize closing time
watch(
  () => form.value.schedule.scheduleType,
  (newValue) => {
    if (newValue === SCHEDULE_TYPE.value.CLOSINGDATE) {
      // Initialize close time for CLOSINGDATE type if not already set
      if (!form.value.schedule.closeSubmissionTime) {
        form.value.schedule.closeSubmissionTime = '23:59';
      }
    }
  }
);

// Watch for date/time changes to update timezone
watch(
  [
    () => form.value.schedule.openSubmissionTime,
    () => form.value.schedule.openSubmissionDateTime,
    () => form.value.schedule.closeSubmissionTime,
    () => form.value.schedule.closeSubmissionDateTime,
  ],
  () => {
    saveTimezone();
  }
);

// Watch for changes that affect reminder eligibility
watch(
  [() => form.value.schedule.openSubmissionDateTime, () => timezone.value],
  () => {
    // Disable reminders if the date is in the past
    if (!isOpenDateInFuture.value && form.value.reminder_enabled) {
      form.value.reminder_enabled = false;
    }
  }
);
// Watch for schedule type changes and clear reminder when schedule is removed or set to MANUAL
watch(
  () => form.value.schedule.scheduleType,
  (newValue, oldValue) => {
    // Only act if there was a previous value (not initial load)
    if (oldValue !== undefined) {
      // Clear reminder when schedule type is set to null or MANUAL
      if (
        (newValue === null || newValue === SCHEDULE_TYPE.value.MANUAL) &&
        form.value.reminder_enabled
      ) {
        form.value.reminder_enabled = false;
      }
    }
  }
);

// Watch for schedule being disabled via the enabled flag
watch(
  () => form.value.schedule.enabled,
  (newValue, oldValue) => {
    // Only act if there was a previous value (not initial load)
    if (oldValue !== undefined) {
      // Clear reminder when schedule is disabled
      if (newValue === false && form.value.reminder_enabled) {
        form.value.reminder_enabled = false;
      }
    }
  }
);

defineExpose({
  saveTimezone,
  isOpenDateInFuture,
});
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="locale">
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
          :lang="locale"
          clearable
        >
          <template v-if="isRTL" #prepend-inner>
            <v-icon icon="mdi:mdi-calendar"></v-icon>
          </template>
          <template v-if="!isRTL" #append>
            <v-icon icon="mdi:mdi-calendar"></v-icon>
          </template>
        </v-text-field>
        <v-text-field
          v-model="form.schedule.openSubmissionTime"
          type="time"
          :placeholder="$t('trans.formSettings.openTime')"
          :label="$t('trans.formSettings.openTime')"
          density="compact"
          variant="outlined"
          :lang="locale"
          clearable
          @update:model-value="saveTimezone"
        >
          <template v-if="!isRTL" #append>
            <v-icon icon="mdi:mdi-clock-outline"></v-icon>
          </template>
        </v-text-field>
      </v-col>

      <!-- Timezone Selector -->
      <v-col cols="8" md="8" class="pl-0 pr-0 pb-0">
        <v-select
          v-model="timezone"
          :items="timezoneOptions"
          label="Timezone"
          density="compact"
          variant="outlined"
          :lang="locale"
        />
      </v-col>

      <!-- Schedule Type -->
      <v-col cols="12" md="12" class="p-0">
        <p class="font-weight-black" :lang="locale">
          {{ $t('trans.formSettings.submissionsDeadline') }}
        </p>
        <v-row>
          <v-radio-group
            v-model="form.schedule.scheduleType"
            class="my-0"
            :rules="scheduleTypedRules"
          >
            <v-radio
              class="mx-2"
              :class="{ 'mr-2': isRTL }"
              :value="SCHEDULE_TYPE.MANUAL"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="locale"
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
                <span :class="{ 'mr-2': isRTL }" :lang="locale"
                  >{{ $t('trans.formSettings.submissionsClosingDate') }}
                </span>
              </template>
            </v-radio>
          </v-radio-group>
        </v-row>
      </v-col>

      <!-- Close date and time settings (only for CLOSINGDATE) -->
      <v-col
        v-if="form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
        cols="12"
        md="12"
        class="pl-0 pr-0 pb-0"
      >
        <v-row class="m-0">
          <!-- Close Date -->
          <v-col cols="8" md="8" class="pl-0 pr-0">
            <v-text-field
              v-model="form.schedule.closeSubmissionDateTime"
              data-test="closeSubmissionDateTime"
              type="date"
              :placeholder="$t('trans.date.date')"
              :label="$t('trans.formSettings.closeSubmissions')"
              density="compact"
              variant="outlined"
              :rules="scheduleCloseDate"
              :lang="locale"
              clearable
              @update:model-value="saveTimezone"
            >
              <template v-if="isRTL" #prepend-inner>
                <v-icon icon="mdi:mdi-calendar"></v-icon>
              </template>
              <template v-if="!isRTL" #append>
                <v-icon icon="mdi:mdi-calendar"></v-icon>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- Close Time -->
        <v-row class="m-0">
          <v-col cols="8" md="8" class="pl-0 pr-0">
            <v-text-field
              v-model="form.schedule.closeSubmissionTime"
              type="time"
              :placeholder="$t('trans.formSettings.closeTime')"
              :label="$t('trans.formSettings.closeTime')"
              density="compact"
              variant="outlined"
              :lang="locale"
              clearable
              @update:model-value="saveTimezone"
            >
              <template v-if="!isRTL" #append>
                <v-icon icon="mdi:mdi-clock-outline"></v-icon>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- Allow Late Submissions -->
        <v-row class="m-0 align-center">
          <v-col cols="12" md="12" class="pl-0 pr-0">
            <v-checkbox
              v-model="form.schedule.allowLateSubmissions.enabled"
              class="my-0 m-0 p-0"
            >
              <template #label>
                <div :class="{ 'mr-2': isRTL }">
                  <span :lang="locale">
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
                      />
                    </template>
                    <span :lang="locale">
                      {{ $t('trans.formSettings.allowLateSubmissionsInfoTip') }}
                    </span>
                  </v-tooltip>
                </div>
              </template>
            </v-checkbox>
          </v-col>
        </v-row>

        <!-- Late submission configuration -->
        <v-expand-transition
          v-if="
            form.schedule.allowLateSubmissions.enabled &&
            form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
          "
          class="pl-3"
        >
          <v-row class="m-0">
            <v-col cols="4" md="4" class="m-0 p-0">
              <v-text-field
                v-model="form.schedule.allowLateSubmissions.forNext.term"
                data-test="afterCloseDateFor"
                :label="$t('trans.formSettings.afterCloseDateFor')"
                type="number"
                density="compact"
                solid
                variant="outlined"
                class="m-0 p-0"
                :class="{ 'dir-rtl': isRTL }"
                :lang="locale"
                :rules="roundNumber"
                @keydown="handleIntegerInput"
              />
            </v-col>
            <v-col cols="4" md="4" class="m-0 p-0">
              <v-select
                v-model="
                  form.schedule.allowLateSubmissions.forNext.intervalType
                "
                :items="['days', 'weeks', 'months', 'quarters', 'years']"
                :label="$t('trans.formSettings.period')"
                density="compact"
                solid
                variant="outlined"
                class="mr-1 pl-2"
                :rules="intervalType"
                :lang="locale"
              />
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-col>

      <!-- Summary - only for CLOSINGDATE -->
      <v-col
        v-if="
          form.schedule.enabled &&
          form.schedule.openSubmissionDateTime &&
          form.schedule.openSubmissionDateTime.length &&
          form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE &&
          form.schedule.closeSubmissionDateTime &&
          form.schedule.closeSubmissionDateTime.length
        "
        cols="12"
        md="12"
        class="pa-0"
      >
        <p class="font-weight-black m-0" :lang="locale">
          {{ $t('trans.formSettings.summary') }}
        </p>
        <span :lang="locale" data-test="submission-schedule-text">
          {{ $t('trans.formSettings.submissionsOpenDateRange') }}
          <b>{{
            formatDateForSummary(
              form.schedule.openSubmissionDateTime,
              form.schedule.openSubmissionTime
            )
          }}</b>
          <span v-if="form.schedule.closeSubmissionDateTime">
            {{ ' ' + $t('trans.formSettings.to') }}
            <b>{{
              formatDateForSummary(
                form.schedule.closeSubmissionDateTime,
                form.schedule.closeSubmissionTime
              )
            }}</b>
          </span>
        </span>
        <span :lang="locale" data-test="late-submission-text">{{
          form.schedule.allowLateSubmissions.enabled &&
          form.schedule.allowLateSubmissions.forNext.intervalType &&
          form.schedule.allowLateSubmissions.forNext.term
            ? ' ' +
              $t('trans.formSettings.allowLateSubmissnInterval') +
              ' ' +
              form.schedule.allowLateSubmissions.forNext.term +
              ' ' +
              form.schedule.allowLateSubmissions.forNext.intervalType +
              '.'
            : '. '
        }}</span>
      </v-col>
    </v-row>

    <!-- SEPARATE SECTION FOR CLOSING MESSAGE -->
    <v-row
      v-if="form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
      class="mt-4"
    >
      <v-col cols="12" class="pa-0">
        <v-checkbox
          v-model="form.schedule.closingMessageEnabled"
          class="my-0"
          hide-details
        >
          <template #label>
            <div>
              <span :class="{ 'mr-2': isRTL }" :lang="locale">
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
                  />
                </template>
                <span :lang="locale">
                  {{ $t('trans.formSettings.customClosingMessageToolTip') }}
                </span>
              </v-tooltip>
            </div>
          </template>
        </v-checkbox>

        <v-expand-transition v-if="form.schedule.closingMessageEnabled">
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
            :lang="locale"
            class="mt-2"
          />
        </v-expand-transition>
      </v-col>
    </v-row>

    <!--REMINDER -->
    <v-row
      v-if="
        form.userType === 'team' &&
        form.schedule.scheduleType !== null &&
        isOpenDateInFuture
      "
      class="mt-4"
    >
      <v-col cols="12" class="pa-0">
        <v-checkbox v-model="form.reminder_enabled" class="my-0" hide-details>
          <template #label>
            <div :class="{ 'mr-2': isRTL }">
              <span :lang="locale">
                {{ $t('trans.formSettings.sendReminderEmail') }}
              </span>
              <v-tooltip close-delay="2500" location="bottom">
                <template #activator="{ props }">
                  <v-icon
                    color="primary"
                    class="ml-3"
                    :class="{ 'mr-2': isRTL }"
                    v-bind="props"
                    icon="mdi:mdi-help-circle-outline"
                  />
                </template>
                <span :lang="locale">
                  {{ $t('trans.formSettings.autoReminderNotificatnToolTip') }}
                  <a
                    :href="githubLinkScheduleAndReminderFeature"
                    class="preview_info_link_field_white"
                    :target="'_blank'"
                    :lang="locale"
                  >
                    {{ $t('trans.formSettings.learnMore') }}
                    <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline" />
                  </a>
                </span>
              </v-tooltip>
            </div>
          </template>
        </v-checkbox>
      </v-col>
    </v-row>
  </BasePanel>
</template>
