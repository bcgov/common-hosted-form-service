<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import FormModuleSettings from '~/components/formModule/FormModuleSettings.vue';
import ManageFormModuleVersions from '~/components/formModule/manage/ManageFormModuleVersions.vue';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const settingsFormModule = ref(null);
const settingsFormModuleValid = ref(false);
const settingsPanel = ref(0);
const versionsPanel = ref(0);

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationStore();

const { formModule } = storeToRefs(formModuleStore);

const versionCount = computed(() =>
  formModule.value && formModule.value.formModuleVersions
    ? formModule.value.formModuleVersions.length
    : 0
);

async function updateSettings() {
  try {
    if (settingsFormModule.value.validate()) {
      await formModuleStore.updateFormModule();
      notificationStore.addNotification({
        text: t('trans.manageFormModule.updateFormModuleSuccess'),
        ...NotificationTypes.SUCCESS,
      });
      formModuleStore.fetchFormModule(formModule.value.id);
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.manageFormModule.updateFormModuleErr'),
      consoleError: t('trans.manageFormModule.updateFormModuleErr', {
        formModuleId: formModule.value.id,
        error: error.message,
      }),
    });
  }
}
</script>

<template>
  <div>
    <v-expansion-panels v-model="settingsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel flat>
        <!-- Form Settings -->
        <v-expansion-panel-title>
          <template #actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong :lang="locale">{{
              $t('trans.manageFormModule.formModuleSettings')
            }}</strong>
            <span>
              <small :lang="locale">
                {{
                  $t('trans.manageFormModule.formModuleCreated', {
                    createdAt: formModule.createdAt,
                    createdBy: formModule.createdBy,
                  })
                }}
              </small>
            </span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-form
            ref="settingsFormModule"
            v-model="settingsFormModuleValid"
            lazy-validation
          >
            <FormModuleSettings />
          </v-form>

          <div class="mb-5">
            <v-btn class="mr-5" color="primary" @click="updateSettings">
              <span :lang="locale">{{
                $t('trans.manageFormModule.update')
              }}</span>
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Form Module Versioning -->
    <v-expansion-panels v-model="versionsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <template #actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong :lang="locale">{{
              $t('trans.manageFormModule.formModuleVersions')
            }}</strong>
            <div>
              <span>
                <strong :lang="locale">{{
                  $t('trans.manageFormModule.totalVersions', {
                    versionCount: versionCount,
                  })
                }}</strong>
              </span>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ManageFormModuleVersions />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style>
.v-expansion-panel:not(.v-expansion-panel--active) {
  margin-bottom: 20px;
}
</style>
