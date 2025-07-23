<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import FormModuleVersionSettings from '~/components/formModuleVersion/FormModuleVersionSettings.vue';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const settingsFormModuleVersionValid = ref(false);
const settingsPanel = ref(0);

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationStore();
const { formModule, formModuleVersion } = storeToRefs(formModuleStore);

async function updateSettings() {
  try {
    if (this.$refs.settingsFormModuleVersion.validate()) {
      await formModuleStore.updateFormModuleVersion();
      notificationStore.addNotification({
        text: t('trans.manageFormModuleVersion.updateFormModuleVersionSuccess'),
        ...NotificationTypes.SUCCESS,
      });
      formModuleStore.fetchFormModuleVersion({
        formModuleId: formModule.value.id,
        formModuleVersionId: formModuleVersion.value.id,
      });
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.manageFormModuleVersion.updateFormModuleVersionErr'),
      consoleError: t(
        'trans.manageFormModuleVersion.updateFormModuleVersionConsErr',
        {
          formModuleVersionId: formModuleVersion.value.id,
          error: error.message,
        }
      ),
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
              $t('trans.manageFormModuleVersion.formModuleVersionSettings')
            }}</strong>
            <span>
              <small :lang="locale"
                >{{
                  $t('trans.manageFormModuleVersion.formModuleVersionCreated', {
                    createdAt: formModuleVersion.createdAt,
                    createdBy: formModuleVersion.createdBy,
                  })
                }}
              </small>
            </span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-form
            ref="settingsFormModuleVersion"
            v-model="settingsFormModuleVersionValid"
            lazy-validation
          >
            <FormModuleVersionSettings />
          </v-form>

          <div class="mb-5">
            <v-btn class="mr-5" color="primary" @click="updateSettings">
              <span :lang="locale">{{
                $t('trans.manageFormModuleVersion.update')
              }}</span>
            </v-btn>
          </div>
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
