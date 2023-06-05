<template>
  <div>
    <v-expansion-panels
      v-model="settingsPanel"
      flat
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat v-if="canEditForm">
        <!-- Form Settings -->
        <v-expansion-panel-header>
          <template v-slot:actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong>{{ $t('trans.manageForm.formSettings') }}</strong>
            <span>
              <small>
                {{ $t('trans.manageForm.created') }}:
                {{ form.createdAt | formatDate }} ({{ form.createdBy }})
              </small>
              <v-btn
                v-if="canEditForm"
                small
                icon
                color="primary"
                @click.native.stop="enableSettingsEdit"
              >
                <v-icon>edit</v-icon>
              </v-btn>
            </span>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-form
            ref="settingsForm"
            :disabled="formSettingsDisabled"
            v-model="settingsFormValid"
            lazy-validation
          >
            <FormSettings :disabled="formSettingsDisabled" />
          </v-form>

          <div v-if="canEditForm && !formSettingsDisabled" class="mb-5">
            <v-btn class="mr-5" color="primary" @click="updateSettings">
              <span>{{ $t('trans.manageForm.update') }}</span>
            </v-btn>
            <v-btn outlined @click="cancelSettingsEdit">
              <span>{{ $t('trans.manageForm.cancel') }}</span>
            </v-btn>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Api Key -->
    <v-expansion-panels
      v-model="apiKeyPanel"
      flat
      class="nrmc-expand-collapse"
      v-if="canManageAPI"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-header>
          <template v-slot:actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong>{{ $t('trans.manageForm.apiKey') }}</strong>
            <span v-if="apiKey">
              <small v-if="apiKey.updatedBy">
                {{ $t('trans.manageForm.updated') }}:
                {{ apiKey.updatedAt | formatDate }} ({{ apiKey.updatedBy }})
              </small>
              <small v-else>
                {{ $t('trans.manageForm.created') }}:
                {{ apiKey.createdAt | formatDate }} ({{ apiKey.createdBy }})
              </small>
            </span>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <ApiKey />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Form Design -->
    <v-expansion-panels
      v-model="versionsPanel"
      flat
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-header>
          <template v-slot:actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong>{{ $t('trans.manageForm.formDesignHistory') }}</strong>
            <div>
              <span>
                <strong>{{ $t('trans.manageForm.totalVersions') }}:</strong>
                {{ combinedVersionAndDraftCount }}
              </span>
              <span class="ml-12 mr-2">
                <strong>{{ $t('trans.manageForm.status') }}:</strong>
                {{ versionState }}
              </span>
            </div>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <ManageVersions />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import { FormPermissions, NotificationTypes } from '@/utils/constants';
import ApiKey from '@/components/forms/manage/ApiKey.vue';
import FormSettings from '@/components/designer/FormSettings.vue';
import ManageVersions from '@/components/forms/manage/ManageVersions.vue';

export default {
  name: 'ManageForm',
  components: { ApiKey, FormSettings, ManageVersions },
  data() {
    return {
      apiKeyPanel: 1,
      formSettingsDisabled: true,
      settingsFormValid: false,
      settingsPanel: 1,
      versionsPanel: 0,
    };
  },
  computed: {
    ...mapGetters('form', ['apiKey', 'drafts', 'form', 'permissions']),
    canEditForm() {
      return this.permissions.includes(FormPermissions.FORM_UPDATE);
    },
    combinedVersionAndDraftCount() {
      return (
        (this.form.versions ? this.form.versions.length : 0) +
        (this.drafts ? this.drafts.length : 0)
      );
    },
    currentVersion() {
      let cv = 'N/A';
      if (this.form.versions && this.form.versions.length) {
        const vers = this.form.versions.find((v) => v.published);
        if (vers) {
          cv = vers.version;
        }
      }
      return cv;
    },
    versionState() {
      if (this.form.versions && this.form.versions.some((v) => v.published)) {
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
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'updateForm']),
    ...mapActions('notifications', ['addNotification']),
    cancelSettingsEdit() {
      this.formSettingsDisabled = true;
      this.fetchForm(this.form.id);
    },
    enableSettingsEdit() {
      // open 'Form Settings' accordion
      this.settingsPanel = 0;
      // enable 'Form Setings' form
      this.formSettingsDisabled = false;
    },
    async updateSettings() {
      try {
        if (this.$refs.settingsForm.validate()) {
          await this.updateForm();
          this.formSettingsDisabled = true;
          this.addNotification({
            message: 'Your form settings have been updated successfully.',
            ...NotificationTypes.SUCCESS,
          });
          this.fetchForm(this.form.id);
        }
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to update the settings for this form.',
          consoleError: `Error updating settings for ${this.form.id}: ${error}`,
        });
      }
    },
  },
};
</script>

<style>
.v-expansion-panel:not(.v-expansion-panel--active) {
  margin-bottom: 20px;
}
</style>
