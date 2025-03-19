<script setup>
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { ScheduleType } from '~/utils/constants';
import { isDateValidForMailNotification } from '~/utils/transformUtils';

const { t, locale } = useI18n({ useScope: 'global' });

const enableReminderDraw = ref(true);
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
  (v) =>
    moment(v).isAfter(form.value.schedule.openSubmissionDateTime, 'day') ||
    t('trans.formSettings.dateDiffMsg'),
]);
const roundNumber = ref([
  (v) => !!v || t('trans.formSettings.fieldRequired'),
  (v) =>
    (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
    t('trans.formSettings.valueMustBeNumber'),
]);
const scheduleTypedRules = ref([
  (v) => !!v || t('trans.formSettings.selectAnOptions'),
]);
const closeMessage = ref([(v) => !!v || t('trans.formSettings.fieldRequired')]);
/* c8 ignore stop */

const { form, isRTL } = storeToRefs(useFormStore());

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

function scheduleTypeChanged() {
  if (form.value.schedule.scheduleType === ScheduleType.MANUAL) {
    form.value.schedule.keepOpenForTerm = null;
    form.value.schedule.keepOpenForInterval = null;
    form.value.schedule.closingMessageEnabled = null;
    form.value.schedule.closingMessage = null;
    form.value.schedule.closeSubmissionDateTime = null;
    form.value.schedule.repeatSubmission = {
      enabled: null,
      repeatUntil: null,
      everyTerm: null,
      everyIntervalType: null,
    };
    form.value.schedule.allowLateSubmissions = {
      enabled: null,
      forNext: {
        term: null,
        intervalType: null,
      },
    };
  }
  if (form.value.schedule.scheduleType === ScheduleType.CLOSINGDATE) {
    form.value.schedule.keepOpenForTerm = null;
    form.value.schedule.keepOpenForInterval = null;
    form.value.schedule.closingMessageEnabled = null;
    form.value.schedule.closingMessage = null;
    form.value.schedule.repeatSubmission = {
      enabled: null,
      repeatUntil: null,
      everyTerm: null,
      everyIntervalType: null,
    };
  }
}

defineExpose({
  enableReminderDraw,
  openDateTypeChanged,
  scheduleTypeChanged,
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
        <p class="font-weight-black" :lang="locale">
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
          data-test="closeSubmissionDateTime"
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
    </v-row>

    <v-checkbox
      v-if="form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
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
              >
              </v-icon>
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.allowLateSubmissionsInfoTip') }}
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

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
            :lang="locale"
          ></v-select>
        </v-col>
      </v-row>
    </v-expand-transition>

    <v-row
      v-if="
        form.schedule.enabled &&
        form.schedule.openSubmissionDateTime &&
        form.schedule.openSubmissionDateTime.length &&
        form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE &&
        form.schedule.closeSubmissionDateTime &&
        form.schedule.closeSubmissionDateTime.length
      "
      class="p-0 m-0"
    >
      <v-col class="p-0 m-0" cols="12" md="12">
        <p class="font-weight-black m-0" :lang="locale">
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
        <span :lang="locale" data-test="submission-schedule-text">
          {{ $t('trans.formSettings.submissionsOpenDateRange') }}
          <b>{{ form.schedule.openSubmissionDateTime }}</b>
          {{ $t('trans.formSettings.to') }}
          <b>
            {{ form.schedule.closeSubmissionDateTime }}
          </b>
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

    <hr
      v-if="
        form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE ||
        (form.userType === 'team' &&
          form.schedule.scheduleType !== null &&
          enableReminderDraw &&
          form.schedule.openSubmissionDateTime)
      "
    />

    <v-row
      v-if="form.schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
      class="p-0 m-0"
    >
      <v-col cols="12" md="12" class="p-0">
        <v-checkbox
          v-model="form.schedule.closingMessageEnabled"
          class="my-0 pt-0"
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
                  ></v-icon>
                </template>
                <span :lang="locale">
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
                ><span :lang="locale">
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
                :lang="locale"
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
                ><span :lang="locale">{{
                  $t('trans.formSettings.sendReminderEmail')
                }}</span></template
              >
              <v-checkbox v-model="form.reminder_enabled" class="my-0 m-0 p-0">
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
                          v-bind="props"
                          icon="mdi:mdi-help-circle-outline"
                          :class="{ 'mr-2': isRTL }"
                        ></v-icon>
                      </template>
                      <span :lang="locale">
                        {{
                          $t('trans.formSettings.autoReminderNotificatnToolTip')
                        }}
                        <a
                          :href="githubLinkScheduleAndReminderFeature"
                          class="preview_info_link_field_white"
                          :target="'_blank'"
                          :lang="locale"
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
