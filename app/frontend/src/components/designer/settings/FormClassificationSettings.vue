<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useRecordsManagementStore } from '~/store/recordsManagement';
import { recordsManagementService } from '~/services';

const { t, locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();
const notificationStore = useNotificationStore();
const recordsManagementStore = useRecordsManagementStore();

const { isRTL } = storeToRefs(formStore);
const { formRetentionPolicy } = storeToRefs(recordsManagementStore);

// DON'T use storeToRefs for this - access directly from store
const retentionClassificationTypes = computed(
  () => recordsManagementStore.retentionClassificationTypes || []
);

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

const customDays = ref(null);
const showCustomDays = ref(false);
const isCustomRetention = ref(false);
const actualRetentionDays = ref(null);
const selectedRetentionOption = ref(null);

// Computed that handles undefined safely
const CLASSIFICATION_TYPES = computed(() => {
  if (
    !retentionClassificationTypes.value ||
    !Array.isArray(retentionClassificationTypes.value)
  ) {
    return [];
  }
  return retentionClassificationTypes.value.map((type) => ({
    value: type,
    label: type.display,
  }));
});

onMounted(async () => {
  await fetchClassificationTypes();
});

async function fetchClassificationTypes() {
  try {
    const result =
      await recordsManagementService.listRetentionClassificationTypes();
    recordsManagementStore.retentionClassificationTypes = result.data;
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.formSettings.fetchRetentionClassificationListError'),
      consoleError: t(
        'trans.formSettings.fetchRetentionClassificationListConsErrMsg',
        {
          error: e.message,
        }
      ),
    });
  }
}

const selectedClassification = computed({
  get() {
    if (
      typeof formRetentionPolicy.value?.retentionClassificationId === 'string'
    ) {
      const match = retentionClassificationTypes.value?.find(
        (type) =>
          type.id === formRetentionPolicy.value.retentionClassificationId
      );
      return (
        match || {
          value: formRetentionPolicy.value.retentionClassificationId,
          label: formRetentionPolicy.value.retentionClassificationId,
        }
      );
    }
    return formRetentionPolicy.value;
  },
  set(newValue) {
    if (newValue && typeof newValue === 'object' && 'value' in newValue) {
      formRetentionPolicy.value.retentionClassificationId = newValue.value.id;
    } else {
      formRetentionPolicy.value.retentionClassificationId = newValue;
    }
  },
});

const handleRetentionChange = (value) => {
  if (value === null) {
    isCustomRetention.value = true;
    showCustomDays.value = true;
    if (!customDays.value) {
      customDays.value = formRetentionPolicy.value?.retentionDays || 30;
    }
  } else {
    showCustomDays.value = false;
    actualRetentionDays.value = value;
    formRetentionPolicy.value.retentionDays = value;
  }
};

const applyCustomDays = () => {
  if (customDays.value) {
    const days = Math.min(Math.max(1, customDays.value), 3650);
    customDays.value = days;
    actualRetentionDays.value = days;
    formRetentionPolicy.value.retentionDays = days;
  }
};

const isStandardRetention = (days) => {
  return retentionOptions.value.some(
    (option) => option.value === days && option.value !== null
  );
};

const initializeRetentionUI = () => {
  if (formRetentionPolicy.value?.retentionDays) {
    actualRetentionDays.value = formRetentionPolicy.value.retentionDays;

    if (isStandardRetention(formRetentionPolicy.value.retentionDays)) {
      showCustomDays.value = false;
      isCustomRetention.value = false;
      selectedRetentionOption.value = formRetentionPolicy.value.retentionDays;
    } else {
      showCustomDays.value = true;
      isCustomRetention.value = true;
      customDays.value = formRetentionPolicy.value.retentionDays;
      selectedRetentionOption.value = null;
    }
  }
};

initializeRetentionUI();

watch(actualRetentionDays, (newValue) => {
  if (newValue && isCustomRetention.value) {
    formRetentionPolicy.value.retentionDays = newValue;
  }
});

const handleEnableChange = (enabled) => {
  if (enabled) {
    if (!formRetentionPolicy.value?.retentionClassificationId) {
      const firstClassification = CLASSIFICATION_TYPES.value[0];
      if (firstClassification?.value?.id) {
        formRetentionPolicy.value.retentionClassificationId =
          firstClassification.value.id;
      }
    }

    if (!formRetentionPolicy.value?.retentionDays) {
      selectedRetentionOption.value = null;
      isCustomRetention.value = true;
      showCustomDays.value = true;
      customDays.value = 30;
      actualRetentionDays.value = 30;
      formRetentionPolicy.value.retentionDays = 30;
    }
  } else {
    formRetentionPolicy.value.retentionDays = null;
    actualRetentionDays.value = null;
    formRetentionPolicy.value.retentionClassificationDescription = null;
    formRetentionPolicy.value.retentionClassificationId = null;
    showCustomDays.value = false;
    customDays.value = null;
    isCustomRetention.value = false;
    selectedRetentionOption.value = null;
  }
};

watch(
  () => formRetentionPolicy.value?.enabled,
  (newValue) => {
    handleEnableChange(newValue);
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
      v-model="formRetentionPolicy.enabled"
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

    <div v-if="formRetentionPolicy.enabled" class="mt-4">
      <v-combobox
        v-model="selectedClassification"
        :items="CLASSIFICATION_TYPES"
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
        v-model="formRetentionPolicy.retentionClassificationDescription"
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
        v-if="formRetentionPolicy.retentionDays"
        type="warning"
        variant="tonal"
        class="mt-4"
      >
        <span :lang="locale">
          {{
            $t('trans.formSettings.deletionDisclaimerWithDays', {
              days: formRetentionPolicy.retentionDays,
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
