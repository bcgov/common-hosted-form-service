<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFeatureFlagStore } from '~/store/featureFlags';
import { useFormStore } from '~/store/form';
import { Regex } from '~/utils/constants';
import DocumentTemplate from '../../forms/manage/DocumentTemplate.vue';

const { t, locale } = useI18n({ useScope: 'global' });

const { form, isRTL } = storeToRefs(useFormStore());

const featureFlagStore = useFeatureFlagStore();
// Allowlist-gated: the submission package email controls only render when
// submitToEmail is active for this form (enabled globally AND allowlisted).
// resolveForContext() is called by the FormDesigner on load.
const submitToEmailActive = computed(() =>
  featureFlagStore.isActive('submitToEmail')
);

/* c8 ignore start */
// The email + template inputs only render when the feature is enabled (the
// v-if below), so these rules don't need to re-check `enabled` — they only run
// while the inputs are mounted, i.e. when enabled. When enabled, both a
// recipient and a template are required.
const submissionPackageEmailRules = computed(() => [
  (v = []) => v.length > 0 || t('trans.formSettings.atLeastOneEmailReq'),
  (v = []) =>
    v.every((item) => new RegExp(Regex.EMAIL).test(String(item).trim())) ||
    t('trans.formSettings.validEmailRequired'),
]);

const submissionPackageTemplateRules = computed(() => [
  (v) => !!v || t('trans.formSettings.templateRequired'),
]);
/* c8 ignore stop */
</script>

<template>
  <template v-if="submitToEmailActive">
    <v-divider class="my-6" />

    <v-checkbox
      v-model="form.submissionPackageSettings.enabled"
      hide-details="auto"
      class="my-0"
      data-test="submission-package-email-test"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale">
            {{ $t('trans.formSettings.emailPackage') }}
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
              {{ $t('trans.formSettings.emailPackageTooltip') }}
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <div v-if="form.submissionPackageSettings.enabled" class="mt-4">
      <v-combobox
        v-model="form.submissionPackageSettings.emails"
        :hide-no-data="false"
        :rules="submissionPackageEmailRules"
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

      <DocumentTemplate
        v-model:selected-template-id="form.submissionPackageSettings.templateId"
        form-settings-mode
      />

      <!-- Hidden validated value so the document template participates in the
           settings v-form validation (DocumentTemplate is not a rules input). -->
      <v-input
        :model-value="form.submissionPackageSettings.templateId"
        :rules="submissionPackageTemplateRules"
        density="compact"
        hide-details="auto"
        :lang="locale"
      />
    </div>
  </template>
</template>
