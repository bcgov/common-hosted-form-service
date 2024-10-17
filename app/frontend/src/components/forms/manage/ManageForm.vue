<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ApiKey from '~/components/forms/manage/ApiKey.vue';
import DocumentTemplate from '~/components/forms/manage/DocumentTemplate.vue';
import ExternalAPIs from '~/components/forms/manage/ExternalAPIs.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import ManageVersions from '~/components/forms/manage/ManageVersions.vue';
import Subscription from '~/components/forms/manage/Subscription.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions, NotificationTypes } from '~/utils/constants';
import FormProfile from '~/components/designer/FormProfile.vue';

const { locale } = useI18n({ useScope: 'global' });

const apiKeyPanel = ref(1);
const cdogsPanel = ref(1);
const externalAPIsPanel = ref(1);
const formSettingsDisabled = ref(true);
const settingsForm = ref(null);
const settingsPanel = ref(1);
const subscription = ref(false);
const subscriptionsPanel = ref(0);
const versionsPanel = ref(0);

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { apiKey, drafts, form, permissions, isRTL, subscriptionData } =
  storeToRefs(formStore);

const canEditForm = computed(() =>
  permissions.value.includes(FormPermissions.FORM_UPDATE)
);

const combinedVersionAndDraftCount = computed(() => {
  return (
    (form.value?.versions ? form.value.versions.length : 0) +
    (drafts.value && Array.isArray(drafts.value) ? drafts.value.length : 0)
  );
});

const currentVersion = computed(() => {
  let cv = 'N/A';
  if (form.value?.versions && form.value.versions.length) {
    const vers = form.value.versions.find((v) => v.published);
    if (vers) {
      cv = vers.version;
    }
  }
  return cv;
});

const versionState = computed(() => {
  if (form.value?.versions && form.value.versions.some((v) => v.published)) {
    return `Published (ver ${currentVersion.value})`;
  } else {
    return 'Unpublished';
  }
});

const canManageAPI = computed(() => {
  return permissions.value.some((p) =>
    [
      FormPermissions.FORM_API_CREATE,
      FormPermissions.FORM_API_READ,
      FormPermissions.FORM_API_UPDATE,
      FormPermissions.FORM_API_DELETE,
    ].includes(p)
  );
});

const isSubscribed = computed(() => {
  if (form.value && form.value.subscribe && form.value.subscribe.enabled) {
    return true;
  } else {
    return false;
  }
});

onMounted(async () => {
  if (canEditForm.value) {
    await formStore.readFormSubscriptionData(form.value.id);
  }
});

async function cancelSettingsEdit() {
  formSettingsDisabled.value = true;
  await formStore.fetchForm(form.value.id);
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
      await formStore.fetchForm(form.value.id);
    }
  } catch (error) {
    notificationStore.addNotification({
      text: 'An error occurred while attempting to update the settings for this form.',
      consoleError: `Error updating settings for ${form.value.id}: ${error}`,
    });
  }
}

function onSubscription(value) {
  subscriptionsPanel.value = value;
}

defineExpose({
  currentVersion,
  cancelSettingsEdit,
  enableSettingsEdit,
  formSettingsDisabled,
  isSubscribed,
  onSubscription,
  settingsPanel,
  subscriptionsPanel,
  updateSettings,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }" class="mt-2">
    <v-expansion-panels
      v-if="canEditForm"
      v-model="settingsPanel"
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <!-- Form Settings -->
        <v-expansion-panel-title>
          <div
            class="header"
            :lang="locale"
            data-test="canExpandFormSettingsPanel"
          >
            <strong>{{ $t('trans.manageForm.formSettings') }}</strong>
            <span :lang="locale">
              <small>
                {{ $t('trans.manageForm.created') }}:
                {{ $filters.formatDate(form.createdAt) }} ({{ form.createdBy }})
              </small>
              <v-btn
                v-if="canEditForm"
                size="x-small"
                variant="text"
                icon
                color="primary"
                style="font-size: 14px"
                :title="$t('trans.generalLayout.edit')"
                data-test="canAllowEditFormSettings"
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
            :disabled="formSettingsDisabled"
            lazy-validation
          >
            <FormSettings
              :disabled="formSettingsDisabled"
              @onSubscription="onSubscription"
            />
            <FormProfile :disabled="formSettingsDisabled" />
          </v-form>

          <div v-if="canEditForm && !formSettingsDisabled" class="mb-5">
            <v-btn
              :class="isRTL ? 'ml-5' : 'mr-5'"
              color="primary"
              :title="$t('trans.manageForm.update')"
              data-test="canEditForm"
              @click="updateSettings"
            >
              <span :lang="locale">{{ $t('trans.manageForm.update') }}</span>
            </v-btn>
            <v-btn
              variant="outlined"
              :title="$t('trans.manageForm.cancel')"
              data-test="canCancelEdit"
              @click="cancelSettingsEdit"
            >
              <span :lang="locale">{{ $t('trans.manageForm.cancel') }}</span>
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Event Subscription -->
    <v-expansion-panels
      v-if="isSubscribed && canEditForm"
      v-model="subscription"
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div class="header" :lang="locale">
            <strong>{{ $t('trans.manageForm.eventSubscription') }}</strong>
            <span v-if="subscriptionData" :lang="locale">
              <small v-if="subscriptionData.updatedBy">
                {{ $t('trans.manageForm.updated') }}:
                {{ $filters.formatDate(subscriptionData.updatedAt) }} ({{
                  subscriptionData.updatedBy
                }})
              </small>
              <small v-else>
                {{ $t('trans.manageForm.created') }}:
                {{ $filters.formatDate(subscriptionData.createdAt) }} ({{
                  subscriptionData.createdBy
                }})
              </small>
            </span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <Subscription />
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
          <div
            class="header"
            :lang="locale"
            data-test="canExpandApiKeySettingsPanel"
          >
            <strong>{{ $t('trans.manageForm.apiKey') }}</strong>
            <span v-if="apiKey" :lang="locale">
              <small v-if="apiKey.updatedBy">
                {{ $t('trans.manageForm.updated') }}:
                {{ $filters.formatDate(apiKey.updatedAt) }} ({{
                  apiKey.updatedBy
                }})
              </small>
              <small v-else>
                {{ $t('trans.manageForm.created') }}:
                {{ $filters.formatDate(apiKey.createdAt) }} ({{
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

    <!-- CDOGS Template -->
    <v-expansion-panels
      v-if="canEditForm"
      v-model="cdogsPanel"
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div class="header" :lang="locale" data-test="canExpandCDOGSPanel">
            <strong>{{ $t('trans.manageForm.cdogsTemplate') }}</strong>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <DocumentTemplate />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- External APIs -->
    <v-expansion-panels
      v-if="canEditForm"
      v-model="externalAPIsPanel"
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div class="header" :lang="locale">
            <strong>{{ $t('trans.manageForm.externalAPIs') }}</strong>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ExternalAPIs />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Form Design -->
    <v-expansion-panels v-model="versionsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div
            class="header"
            :lang="locale"
            data-test="canExpandFormDesignHistoryPanel"
          >
            <strong style="flex: 1">{{
              $t('trans.manageForm.formDesignHistory')
            }}</strong>
            <div>
              <span :lang="locale">
                <strong>{{ $t('trans.manageForm.totalVersions') }}:</strong>
                {{ combinedVersionAndDraftCount }}
              </span>
            </div>
            <span class="ml-12 mr-2" :lang="locale">
              <strong>{{ $t('trans.manageForm.status') }}:</strong>
              {{ versionState }}
            </span>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ManageVersions />
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
