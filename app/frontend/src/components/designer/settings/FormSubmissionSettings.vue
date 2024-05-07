<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { Regex } from '~/utils/constants';

const { form, isRTL, lang } = storeToRefs(useFormStore());

/* c8 ignore start */
const emailArrayRules = ref([
  (v) =>
    !form.value.sendSubmissionReceivedEmail ||
    v.length > 0 ||
    i18n.t('trans.formSettings.atLeastOneEmailReq'),
  (v) =>
    !form.value.sendSubmissionReceivedEmail ||
    v.every((item) => new RegExp(Regex.EMAIL).test(item)) ||
    i18n.t('trans.formSettings.validEmailRequired'),
]);
/* c8 ignore stop */
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">
        {{ $t('trans.formSettings.afterSubmission') }}
      </span></template
    >
    <v-checkbox
      v-model="form.showSubmissionConfirmation"
      hide-details="auto"
      class="my-0"
      :class="{ 'dir-rtl': isRTL }"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="lang">
            {{ $t('trans.formSettings.submissionConfirmation') }}</span
          >
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
            <span>
              <span
                :lang="lang"
                v-html="$t('trans.formSettings.submissionConfirmationToolTip')"
              />
              <ul>
                <li :lang="lang">
                  {{ $t('trans.formSettings.theConfirmationID') }}
                </li>
                <li :lang="lang">
                  {{ $t('trans.formSettings.infoB') }}
                </li>
              </ul>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.sendSubmissionReceivedEmail"
      hide-details="auto"
      class="my-0"
      data-test="email-test"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="lang">
            {{ $t('trans.formSettings.emailNotificatnToTeam') }}</span
          >
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
            <span :lang="lang">
              {{ $t('trans.formSettings.emailNotificatnToTeamToolTip') }}
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-combobox
      v-if="form.sendSubmissionReceivedEmail"
      v-model="form.submissionReceivedEmails"
      :hide-no-data="false"
      :rules="emailArrayRules"
      solid
      variant="outlined"
      hide-selected
      clearable
      :hint="$t('trans.formSettings.addMoreValidEmailAddrs')"
      :label="$t('trans.formSettings.notificationEmailAddrs')"
      multiple
      chips
      closable-chips
      :delimiters="[' ', ',']"
      append-icon=""
      :lang="lang"
    >
      <template #no-data>
        <v-list-item>
          <v-list-item-title>
            <span
              :lang="lang"
              v-html="$t('trans.formSettings.pressToAddMultiEmail')"
            />
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-combobox>
  </BasePanel>
</template>
