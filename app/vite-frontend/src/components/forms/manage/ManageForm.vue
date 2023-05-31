<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import ApiKey from '~/components/forms/manage/ApiKey.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import ManageVersions from '~/components/forms/manage/ManageVersions.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions, NotificationTypes } from '~/utils/constants';

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const apiKeyPanel = ref(1);
const formSettingsDisabled = ref(true);
const settingsForm = ref(null);
const settingsFormValid = ref(false);
const settingsPanel = ref(1);
const versionsPanel = ref(0);

const { drafts, form, permissions } = storeToRefs(formStore);

const canEditForm = computed(() =>
  permissions.value.includes(FormPermissions.FORM_UPDATE)
);
const combinedVersionAndDraftCount = computed(
  () =>
    (form?.value?.versions ? form.value.versions.length : 0) +
    (drafts?.value ? drafts.value.length : 0)
);
const currentVersion = computed(() => {
  let cv = 'N/A';
  if (form?.value?.versions && form.value.versions.length) {
    const vers = form.value.versions.find((v) => v.published);
    if (vers) {
      cv = vers.version;
    }
  }
  return cv;
});
const versionState = computed(() => {
  if (form?.value?.versions && form.value.versions.some((v) => v.published)) {
    return `Published (ver ${currentVersion.value})`;
  } else {
    return 'Unpublished';
  }
});
const canManageAPI = computed(() =>
  permissions.value.some((p) =>
    [
      FormPermissions.FORM_API_CREATE,
      FormPermissions.FORM_API_READ,
      FormPermissions.FORM_API_UPDATE,
      FormPermissions.FORM_API_DELETE,
    ].includes(p)
  )
);

function cancelSettingsEdit() {
  formSettingsDisabled.value = true;
  formStore.fetchForm(form.value.id);
}

function enableSettingsEdit() {
  settingsPanel.value = 0;
  formSettingsDisabled.value = false;
}

async function updateSettings() {
  try {
    const { valid } = await settingsForm.value.validate();

    if (valid) {
      await formStore.updateForm();
      formSettingsDisabled.value = true;
      notificationStore.addNotification({
        text: 'Your form settings have been updated successfully.',
        ...NotificationTypes.SUCCESS,
      });
      formStore.fetchForm(form.value.id);
    }
  } catch (error) {
    notificationStore.addNotification({
      text: 'An error occurred while attempting to update the settings for this form.',
      consoleError: `Error updating settings for ${form.value.id}: ${error}`,
    });
  }
}
</script>

<template>
  <v-container fluid>
    <v-expansion-panels v-model="settingsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel v-if="canEditForm" flat>
        <!-- Form Settings -->
        <v-expansion-panel-title>
          <div class="header">
            <strong>Form Settings</strong>
            <span>
              <small>
                Created: {{ $filters.formatDate(form.createdAt) }} ({{
                  form.createdBy
                }})
              </small>
              <v-btn
                v-if="canEditForm"
                size="small"
                variant="text"
                icon
                color="primary"
                @click.stop="enableSettingsEdit"
              >
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-form
            ref="settingsForm"
            v-model="settingsFormValid"
            :disabled="formSettingsDisabled"
            lazy-validation
          >
            <FormSettings :disabled="formSettingsDisabled" />
          </v-form>

          <div v-if="canEditForm && !formSettingsDisabled" class="mb-5">
            <v-btn class="mr-5" color="primary" @click="updateSettings">
              <span>Update</span>
            </v-btn>
            <v-btn variant="outlined" @click="cancelSettingsEdit">
              <span>Cancel</span>
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Api Key -->
    <v-expansion-panels
      v-if="canManageAPI"
      v-model="apiKeyPanel"
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div class="header">
            <strong>API Key</strong>
            <span v-if="apiKey">
              <small v-if="apiKey.updatedBy">
                Updated: {{ $filters.formatDate(apiKey.updatedAt) }} ({{
                  apiKey.updatedBy
                }})
              </small>
              <small v-else>
                Created: {{ $filters.formatDate(apiKey.createdAt) }} ({{
                  apiKey.createdBy
                }})
              </small>
            </span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ApiKey />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Form Design -->
    <v-expansion-panels v-model="versionsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-row no-gutters>
            <v-col cols="7" class="d-flex justify-start">
              <strong>Form Design History</strong>
            </v-col>
            <v-col class="d-flex justify-end">
              <div>
                <span>
                  <strong>Total Versions:</strong>
                  {{ combinedVersionAndDraftCount }}
                </span>
              </div>
            </v-col>
            <v-col class="d-flex justify-end">
              <span class="ml-12 mr-2">
                <strong>Status:</strong>
                {{ versionState }}
              </span>
            </v-col>
          </v-row>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ManageVersions />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<style>
.v-expansion-panel:not(.v-expansion-panel--active) {
  margin-bottom: 20px;
}
</style>
