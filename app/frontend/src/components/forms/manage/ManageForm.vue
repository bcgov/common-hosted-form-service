<script>
import { mapActions, mapState } from 'pinia';

import ApiKey from '~/components/forms/manage/ApiKey.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import ManageVersions from '~/components/forms/manage/ManageVersions.vue';
import Subscription from '~/components/forms/manage/Subscription.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions, NotificationTypes } from '~/utils/constants';

export default {
  components: {
    ApiKey,
    FormSettings,
    ManageVersions,
    Subscription,
  },
  data() {
    return {
      apiKeyPanel: 1,
      formSettingsDisabled: true,
      settingsFormValid: false,
      settingsPanel: 1,
      versionsPanel: 0,
      subscriptionsPanel: 0,
      subscription: false,
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'apiKey',
      'drafts',
      'form',
      'permissions',
      'isRTL',
      'lang',
      'subscriptionData',
    ]),
    canEditForm() {
      return this.permissions.includes(FormPermissions.FORM_UPDATE);
    },
    combinedVersionAndDraftCount() {
      return (
        (this.form?.versions ? this.form.versions.length : 0) +
        (this.drafts && Array.isArray(this.drafts) ? this.drafts.length : 0)
      );
    },
    currentVersion() {
      let cv = 'N/A';
      if (this.form?.versions && this.form.versions.length) {
        const vers = this.form.versions.find((v) => v.published);
        if (vers) {
          cv = vers.version;
        }
      }
      return cv;
    },
    versionState() {
      if (this.form?.versions && this.form.versions.some((v) => v.published)) {
        return `Published (ver ${this.currentVersion})`;
      } else {
        return 'Unpublished';
      }
    },
    canManageAPI() {
      return this.permissions.some((p) =>
        [
          FormPermissions.FORM_API_CREATE,
          FormPermissions.FORM_API_READ,
          FormPermissions.FORM_API_UPDATE,
          FormPermissions.FORM_API_DELETE,
        ].includes(p)
      );
    },
    isSubscribed() {
      if (this.form && this.form.subscribe && this.form.subscribe.enabled) {
        return true;
      } else {
        return false;
      }
    },
  },
  async mounted() {
    await this.readFormSubscriptionData(this.form.id);
  },
  methods: {
    ...mapActions(useFormStore, [
      'fetchForm',
      'updateForm',
      'readFormSubscriptionData',
    ]),
    ...mapActions(useNotificationStore, ['addNotification']),
    cancelSettingsEdit() {
      this.formSettingsDisabled = true;
      this.fetchForm(this.form.id);
    },

    enableSettingsEdit() {
      this.settingsPanel = 0;
      this.formSettingsDisabled = false;
    },

    async updateSettings() {
      try {
        const { valid } = await this.$refs.settingsForm.validate();

        if (valid) {
          await this.updateForm();
          this.formSettingsDisabled = true;
          this.addNotification({
            text: 'Your form settings have been updated successfully.',
            ...NotificationTypes.SUCCESS,
          });
          this.fetchForm(this.form.id);
        }
      } catch (error) {
        this.addNotification({
          text: 'An error occurred while attempting to update the settings for this form.',
          consoleError: `Error updating settings for ${this.form.id}: ${error}`,
        });
      }
    },
    onSubscription(value) {
      this.subscriptionsPanel = value;
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-expansion-panels v-model="settingsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel v-if="canEditForm" flat>
        <!-- Form Settings -->
        <v-expansion-panel-title>
          <div class="header" :lang="lang">
            <strong>{{ $t('trans.manageForm.formSettings') }}</strong>
            <span :lang="lang">
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
            <FormSettings
              :disabled="formSettingsDisabled"
              @onSubscription="onSubscription"
            />
          </v-form>

          <div v-if="canEditForm && !formSettingsDisabled" class="mb-5">
            <v-btn
              :class="isRTL ? 'ml-5' : 'mr-5'"
              color="primary"
              @click="updateSettings"
            >
              <span :lang="lang">{{ $t('trans.manageForm.update') }}</span>
            </v-btn>
            <v-btn variant="outlined" @click="cancelSettingsEdit">
              <span :lang="lang">{{ $t('trans.manageForm.cancel') }}</span>
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-expansion-panels
      v-if="isSubscribed"
      v-model="subscription"
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div class="header" :lang="lang">
            <strong>{{ $t('trans.manageForm.eventSubscription') }}</strong>
            <span v-if="subscriptionData" :lang="lang">
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
          <div class="header" :lang="lang">
            <strong>{{ $t('trans.manageForm.apiKey') }}</strong>
            <span v-if="apiKey" :lang="lang">
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

    <!-- Form Design -->
    <v-expansion-panels v-model="versionsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <div class="header" :lang="lang">
            <strong style="flex: 1">{{
              $t('trans.manageForm.formDesignHistory')
            }}</strong>
            <div>
              <span :lang="lang">
                <strong>{{ $t('trans.manageForm.totalVersions') }}:</strong>
                {{ combinedVersionAndDraftCount }}
              </span>
            </div>
            <span class="ml-12 mr-2" :lang="lang">
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
