<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { IdentityMode, Regex } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const { form, isRTL } = storeToRefs(useFormStore());

const isPublicForm = computed(
  () => form.value.userType === IdentityMode.PUBLIC
);
// Returning undefined (rather than false) lets the surrounding <v-form disabled>
// cascade through; an explicit `false` would override the parent's view-only
// state on a published form and leave only this checkbox toggleable.
const sharingToggleDisabled = computed(() =>
  isPublicForm.value ? undefined : true
);
const urlSharingDisabled = computed(
  () => isPublicForm.value && form.value.enableSubmissionUrlSharing === false
);

// The "email me a copy" email contains a link back to /form/success?s=<id>.
// When URL sharing is off that link opens in a browser with no access token
// and renders the static block, so the email is misleading; worse, forwarding
// the email is the exact URL-leak vector turning sharing off is meant to close.
// Auto-uncheck on disable so the form owner never ships a sharing-off form
// with a promise the receipt can't keep.
function enableSubmissionUrlSharingChanged(checked) {
  form.value.enableSubmissionUrlSharing = checked;
  if (!checked) {
    form.value.enableSubmitterEmailReceipt = false;
  }
}

/* c8 ignore start */
const emailArrayRules = ref([
  (v) =>
    !form.value.sendSubmissionReceivedEmail ||
    v.length > 0 ||
    t('trans.formSettings.atLeastOneEmailReq'),
  (v) =>
    !form.value.sendSubmissionReceivedEmail ||
    v.every((item) => new RegExp(Regex.EMAIL).test(item)) ||
    t('trans.formSettings.validEmailRequired'),
]);
/* c8 ignore stop */
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="locale">
        {{ $t('trans.formSettings.afterSubmission') }}
      </span></template
    >
    <!-- Enable Submission URL Sharing (only meaningful on public forms) -->
    <v-checkbox
      :model-value="form.enableSubmissionUrlSharing !== false"
      :disabled="sharingToggleDisabled"
      hide-details="auto"
      class="my-0"
      data-test="enableSubmissionUrlSharingCheckbox"
      :class="{ 'dir-rtl': isRTL }"
      @update:model-value="enableSubmissionUrlSharingChanged"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            v-html="$t('trans.formSettings.enableSubmissionUrlSharing')"
          />
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
            <span
              :lang="locale"
              v-html="$t('trans.formSettings.enableSubmissionUrlSharingTip')"
            />
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.showSubmissionConfirmation"
      hide-details="auto"
      data-test="canAllowSubmissionConfirmationCheckbox"
      class="my-0"
      :class="{ 'dir-rtl': isRTL }"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            v-html="$t('trans.formSettings.submissionConfirmation')"
          />
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
            <span
              :lang="locale"
              v-html="$t('trans.formSettings.submissionConfirmationToolTip')"
            />
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.enableSubmitterEmailReceipt"
      :disabled="urlSharingDisabled"
      hide-details="auto"
      data-test="enableSubmitterEmailReceiptCheckbox"
      class="my-0"
      :class="{ 'dir-rtl': isRTL }"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            v-html="$t('trans.formSettings.enableSubmitterEmailReceipt')"
          />
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
            <span
              :lang="locale"
              v-html="$t('trans.formSettings.enableSubmitterEmailReceiptTip')"
            />
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.hideSubmissionContentOnSuccess"
      :disabled="sharingToggleDisabled"
      hide-details="auto"
      data-test="hideSubmissionContentOnSuccessCheckbox"
      class="my-0"
      :class="{ 'dir-rtl': isRTL }"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            v-html="$t('trans.formSettings.hideSubmissionContentOnSuccess')"
          />
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
            <span
              :lang="locale"
              v-html="
                $t('trans.formSettings.hideSubmissionContentOnSuccessTip')
              "
            />
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
          <span :lang="locale">
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
            <span :lang="locale">
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
      :lang="locale"
    >
      <template #no-data>
        <v-list-item>
          <v-list-item-title>
            <span
              :lang="locale"
              v-html="$t('trans.formSettings.pressToAddMultiEmail')"
            />
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-combobox>
  </BasePanel>
</template>
