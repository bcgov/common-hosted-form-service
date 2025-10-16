<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { DataClassificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();

const { form, isRTL } = storeToRefs(formStore);

// Common classification types (just suggestions)
const classificationTypes = ref([
  {
    value: DataClassificationTypes.PUBLIC,
    label: t('trans.formSettings.classPublic'),
  },
  {
    value: DataClassificationTypes.INTERNAL,
    label: t('trans.formSettings.classInternal'),
  },
  {
    value: DataClassificationTypes.SENSITIVE,
    label: t('trans.formSettings.classSensitive'),
  },
  {
    value: DataClassificationTypes.CONFIDENTIAL,
    label: t('trans.formSettings.classConfidential'),
  },
  {
    value: DataClassificationTypes.PROTECTED,
    label: t('trans.formSettings.classProtected'),
  },
]);

// Common retention periods
const retentionOptions = ref([
  { value: 30, label: t('trans.formSettings.days30') },
  { value: 90, label: t('trans.formSettings.days90') },
  { value: 180, label: t('trans.formSettings.days180') },
  { value: 365, label: t('trans.formSettings.year1') },
  { value: 730, label: t('trans.formSettings.years2') },
  { value: 1825, label: t('trans.formSettings.years5') },
  { value: null, label: t('trans.formSettings.daysCustom') },
]);

// For custom retention days
const customDays = ref(null);
const showCustomDays = ref(false);
// Track if we're using a custom retention period
const isCustomRetention = ref(false);
// Actual retendion days value for the database
const actualRetentionDays = ref(null);

// Use computed properties to transform between object and string
const selectedClassification = computed({
  get() {
    if (!form.value.classificationType) return null;

    // If classificationType is already a string, find the matching object
    if (typeof form.value.classificationType === 'string') {
      const match = classificationTypes.value.find(
        (type) => type.value === form.value.classificationType
      );
      return (
        match || {
          value: form.value.classificationType,
          label: form.value.classificationType,
        }
      );
    }

    // Otherwise return the existing object
    return form.value.classificationType;
  },
  set(newValue) {
    // When setting, ensure we store just the string value
    if (newValue && typeof newValue === 'object' && 'value' in newValue) {
      form.value.classificationType = newValue.value;
    } else {
      form.value.classificationType = newValue;
    }
  },
});

// Initialize form fields if they don't exist
if (form.value.enableHardDeletion === undefined) {
  form.value.enableHardDeletion = false;
}

if (form.value.classificationType === undefined) {
  form.value.classificationType = null;
}

if (form.value.retentionDays === undefined) {
  form.value.retentionDays = null;
}

if (form.value.classificationDescription === undefined) {
  form.value.classificationDescription = null;
}

// Handle retention period selection
const handleRetentionChange = (value) => {
  if (value === null) {
    // Custom option selected
    isCustomRetention.value = true;
    showCustomDays.value = true;
    if (!customDays.value) {
      customDays.value = form.value.retentionDays || 30;
    }
  } else {
    // Standard option selected
    showCustomDays.value = false;
    actualRetentionDays.value = value;
    form.value.retentionDays = value;
  }
};

// Apply custom days value to form
const applyCustomDays = () => {
  if (customDays.value) {
    // Ensure value is between 1 and 3650 (10 years)
    const days = Math.min(Math.max(1, customDays.value), 3650);
    customDays.value = days;
    actualRetentionDays.value = days;
    form.value.retentionDays = days;
  }
};

// Check if the selected retention period is a standard option
const isStandardRetention = (days) => {
  return retentionOptions.value.some(
    (option) => option.value === days && option.value !== null
  );
};

// Initialize the UI based on form data
const initializeRetentionUI = () => {
  if (form.value.retentionDays) {
    actualRetentionDays.value = form.value.retentionDays;

    if (isStandardRetention(form.value.retentionDays)) {
      showCustomDays.value = false;
      isCustomRetention.value = false;
      selectedRetentionOption.value = form.value.retentionDays;
    } else {
      // If it's a non-standard value, treat as custom
      showCustomDays.value = true;
      isCustomRetention.value = true;
      customDays.value = form.value.retentionDays;
      selectedRetentionOption.value = null;
    }
  }
};

// Add a ref to track the selected dropdown option separately
const selectedRetentionOption = ref(null);

// Watch for changes in the actual retention days to update UI if needed
watch(actualRetentionDays, (newValue) => {
  if (newValue && isCustomRetention.value) {
    form.value.retentionDays = newValue;
  }
});

// Call initialization
initializeRetentionUI();

// Reset classification fields when hard deletion is disabled
const handleEnableChange = (enabled) => {
  if (!enabled) {
    form.value.classificationType = null;
    form.value.retentionDays = null;
    actualRetentionDays.value = null;
    form.value.classificationDescription = null;
    showCustomDays.value = false;
    customDays.value = null;
    isCustomRetention.value = false;
    selectedRetentionOption.value = null;
  } else {
    // When enabling, default to a classification type if none exists
    if (!form.value.classificationType) {
      form.value.classificationType = DataClassificationTypes.INTERNAL;
    }

    // Set default retention period to custom when enabling
    if (!form.value.retentionDays) {
      selectedRetentionOption.value = null; // Use the custom option in dropdown
      isCustomRetention.value = true;
      showCustomDays.value = true;
      customDays.value = 30; // Default value
      actualRetentionDays.value = 30;
      form.value.retentionDays = 30; // Store actual days in the form
    }
  }
};

// Watch for changes in enableHardDeletion to properly initialize UI
watch(
  () => form.value.enableHardDeletion,
  (newValue) => {
    if (newValue && !form.value.retentionDays) {
      handleEnableChange(true);
    }
  }
);
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>
      <span :lang="locale">
        {{ $t('trans.formSettings.dataRetention') }}
      </span>
    </template>

    <v-checkbox
      v-model="form.enableHardDeletion"
      hide-details="auto"
      data-test="enableHardDeletionCheckbox"
      class="my-0"
      :class="{ 'dir-rtl': isRTL }"
      @update:model-value="handleEnableChange"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale">
            {{ $t('trans.formSettings.enableHardDeletion') }}
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
            <span>
              <span
                :lang="locale"
                v-html="$t('trans.formSettings.hardDeletionTooltip')"
              />
              <ul>
                <li :lang="locale">
                  {{ $t('trans.formSettings.hardDeletionWarning') }}
                </li>
                <li :lang="locale">
                  {{ $t('trans.formSettings.permanentDeletion') }}
                </li>
              </ul>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <div v-if="form.enableHardDeletion" class="mt-4">
      <v-combobox
        v-model="selectedClassification"
        :items="classificationTypes"
        item-title="label"
        item-value="value"
        :label="$t('trans.formSettings.dataClassification')"
        :hint="$t('trans.formSettings.dataClassificationHint')"
        persistent-hint
        variant="outlined"
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        clearable
        return-object
      ></v-combobox>

      <v-select
        v-model="selectedRetentionOption"
        :items="retentionOptions"
        item-title="label"
        item-value="value"
        :label="$t('trans.formSettings.retentionPeriod')"
        :hint="$t('trans.formSettings.retentionPeriodHint')"
        persistent-hint
        variant="outlined"
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        @update:model-value="handleRetentionChange"
      ></v-select>

      <v-text-field
        v-if="showCustomDays"
        v-model="customDays"
        type="number"
        min="1"
        max="3650"
        :label="$t('trans.formSettings.customDaysLabel')"
        :hint="$t('trans.formSettings.customDaysHint')"
        persistent-hint
        variant="outlined"
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        @blur="applyCustomDays"
      ></v-text-field>

      <v-textarea
        v-model="form.classificationDescription"
        :label="$t('trans.formSettings.classificationDescription')"
        :hint="$t('trans.formSettings.classificationDescriptionHint')"
        persistent-hint
        variant="outlined"
        rows="3"
        auto-grow
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
      ></v-textarea>

      <v-alert
        v-if="form.retentionDays"
        type="warning"
        variant="tonal"
        class="mt-4"
      >
        <span :lang="locale">
          {{
            $t('trans.formSettings.deletionDisclaimerWithDays', {
              days: form.retentionDays,
            })
          }}
        </span>
      </v-alert>

      <v-alert v-else type="info" variant="tonal" class="mt-4">
        <span :lang="locale">
          {{ $t('trans.formSettings.setRetentionPrompt') }}
        </span>
      </v-alert>
    </div>
  </BasePanel>
</template>
