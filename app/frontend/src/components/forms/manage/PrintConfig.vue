<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { fetchDocumentTemplates } from '~/composables/documentTemplate';
import { useFormStore } from '~/store/form';
import { printConfigService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const printConfig = ref(null);
const localConfig = ref({
  code: 'default',
  templateId: null,
  reportNameOption: 'formName',
  reportName: null,
});
const loading = ref(true);
const saving = ref(false);
const documentTemplates = ref([]);

const notificationStore = useNotificationStore();
const { form, isRTL } = storeToRefs(useFormStore());

const templateOptions = computed(() => {
  return documentTemplates.value.map((template) => ({
    title: template.filename,
    value: template.templateId,
  }));
});

const hasTemplates = computed(() => {
  return documentTemplates.value && documentTemplates.value.length > 0;
});

const isDirectPrint = computed(() => {
  return localConfig.value.code === 'direct';
});

const templateRules = computed(() => {
  return [
    (v) => {
      if (localConfig.value.code === 'direct') {
        return !!v || t('trans.printConfig.templateRequired');
      }
      return true;
    },
  ];
});

onMounted(async () => {
  await Promise.all([fetchPrintConfig(), fetchTemplates()]);
  loading.value = false;
});

async function fetchPrintConfig() {
  try {
    const response = await printConfigService.readPrintConfig(form.value.id);
    if (response.data) {
      printConfig.value = response.data;
      localConfig.value = {
        code: response.data.code || 'default',
        templateId: response.data.templateId || null,
        reportNameOption: response.data.reportNameOption || 'formName',
        reportName: response.data.reportName || null,
      };
    } else {
      // No config exists, use defaults
      localConfig.value = {
        code: 'default',
        templateId: null,
        reportNameOption: 'formName',
        reportName: null,
      };
    }
  } catch (e) {
    // Config doesn't exist yet (404) or other error, use defaults
    // This is expected behavior - gracefully fall back to defaults
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('Print config not found, using defaults:', e);
    }
    localConfig.value = {
      code: 'default',
      templateId: null,
      reportNameOption: 'formName',
      reportName: null,
    };
  }
}

async function fetchTemplates() {
  try {
    documentTemplates.value = await fetchDocumentTemplates(form.value.id);

    // If we have a saved templateId but it's not in the available templates list,
    // it may have been deleted - show a warning
    if (
      printConfig.value &&
      printConfig.value.code === 'direct' &&
      printConfig.value.templateId &&
      !documentTemplates.value.some(
        (t) => t.templateId === printConfig.value.templateId
      )
    ) {
      notificationStore.addNotification({
        text: t('trans.printConfig.templateDeleted'),
        ...NotificationTypes.WARNING,
      });
      // Reset templateId so user must re-select
      localConfig.value.templateId = null;
    }
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.documentTemplate.fetchError'),
      consoleError: t('trans.documentTemplate.fetchError', {
        error: e.message,
      }),
    });
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const data = {
      code: localConfig.value.code,
    };

    if (localConfig.value.code === 'direct') {
      data.templateId = localConfig.value.templateId;
      data.outputFileType = 'pdf';
      // Include reportNameOption and reportName
      data.reportNameOption = localConfig.value.reportNameOption || 'formName';
      // Only include reportName if custom option is selected
      if (localConfig.value.reportNameOption === 'custom') {
        data.reportName = localConfig.value.reportName || form.value.name;
      } else {
        data.reportName = null;
      }
    } else {
      data.templateId = null;
      data.outputFileType = null;
      data.reportNameOption = null;
      data.reportName = null;
    }

    await printConfigService.upsertPrintConfig(form.value.id, data);
    await fetchPrintConfig();

    notificationStore.addNotification({
      text: t('trans.printConfig.saveSuccess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.printConfig.saveError'),
      consoleError: t('trans.printConfig.saveError', {
        error: e.message,
      }),
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div class="mb-4" :lang="locale">
      {{ $t('trans.printConfig.description') }}
    </div>

    <!-- Print Type Selection -->
    <div class="mb-4">
      <v-radio-group v-model="localConfig.code" :lang="locale">
        <template #label>
          <div class="font-weight-bold">{{ $t('trans.printConfig.type') }}</div>
        </template>
        <v-radio value="default" :label="$t('trans.printConfig.typeDefault')">
          <template #label>
            <div>
              <div class="font-weight-medium">
                {{ $t('trans.printConfig.typeDefault') }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('trans.printConfig.typeDefaultDescription') }}
              </div>
            </div>
          </template>
        </v-radio>
        <v-radio
          value="direct"
          :label="$t('trans.printConfig.typeDirect')"
          :disabled="!hasTemplates"
        >
          <template #label>
            <div>
              <div class="font-weight-medium">
                {{ $t('trans.printConfig.typeDirect') }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('trans.printConfig.typeDirectDescription') }}
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>
    </div>

    <!-- Template Selection (when Direct is selected) -->
    <v-expand-transition>
      <div v-if="isDirectPrint" class="mb-4 pl-12 pr-12">
        <v-alert
          v-if="!hasTemplates"
          type="warning"
          variant="tonal"
          class="mb-4"
          :lang="locale"
        >
          {{ $t('trans.printConfig.noTemplatesAvailable') }}
        </v-alert>
        <v-select
          v-else
          v-model="localConfig.templateId"
          :items="templateOptions"
          :label="$t('trans.printConfig.selectTemplate')"
          :rules="templateRules"
          :lang="locale"
          :disabled="!hasTemplates"
          clearable
          class="mb-4"
        />

        <!-- Output File Name Options (when Direct is selected) -->
        <div class="mb-4">
          <v-radio-group v-model="localConfig.reportNameOption" :lang="locale">
            <template #label>
              <div class="font-weight-bold">
                {{ $t('trans.printConfig.reportNameLabel') }}
              </div>
            </template>
            <v-radio
              value="formName"
              :label="$t('trans.printConfig.reportNameOptionFormName')"
            >
              <template #label>
                <div>
                  <div class="font-weight-medium">
                    {{ $t('trans.printConfig.reportNameOptionFormName') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{
                      $t(
                        'trans.printConfig.reportNameOptionFormNameDescription'
                      )
                    }}
                  </div>
                </div>
              </template>
            </v-radio>
            <v-radio
              value="custom"
              :label="$t('trans.printConfig.reportNameOptionCustom')"
            >
              <template #label>
                <div>
                  <div class="font-weight-medium">
                    {{ $t('trans.printConfig.reportNameOptionCustom') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{
                      $t('trans.printConfig.reportNameOptionCustomDescription')
                    }}
                  </div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>

          <!-- Custom Name Input (shown only when custom option is selected) -->
          <v-expand-transition>
            <v-text-field
              v-if="localConfig.reportNameOption === 'custom'"
              v-model="localConfig.reportName"
              :label="$t('trans.printConfig.reportNameCustomInput')"
              :hint="$t('trans.printConfig.reportNameCustomInputHint')"
              :placeholder="form.name"
              variant="outlined"
              :lang="locale"
              persistent-hint
              class="mt-2"
            />
          </v-expand-transition>
        </div>
      </div>
    </v-expand-transition>

    <!-- Save Button -->
    <div class="mt-4">
      <v-btn
        color="primary"
        :loading="saving"
        :disabled="saving || (isDirectPrint && !localConfig.templateId)"
        :title="$t('trans.printConfig.save')"
        @click="handleSave"
      >
        <span v-if="!saving" :lang="locale">{{
          $t('trans.printConfig.save')
        }}</span>
        <span v-else :lang="locale">{{ $t('trans.printConfig.saving') }}</span>
      </v-btn>
    </div>
  </div>
</template>
