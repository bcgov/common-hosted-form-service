<template>
  <div>
    <v-expansion-panels v-model="settingsPanel" class="nrmc-expand-collapse">
      <v-expansion-panel v-if="canEditForm" flat>
        <!-- Form Settings -->
        <v-expansion-panel-title>
          <template #actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
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
                icon
                color="primary"
                @click.stop="enableSettingsEdit"
              >
                <v-icon>edit</v-icon>
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
          <template #actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
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
      <v-expansion-panel flat>
        <v-expansion-panel-title>
          <template #actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong>Form Design History</strong>
            <div>
              <span>
                <strong>Total Versions:</strong>
                {{ combinedVersionAndDraftCount }}
              </span>
              <span class="ml-12 mr-2">
                <strong>Status:</strong>
                {{ versionState }}
              </span>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ManageVersions />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import { FormPermissions, NotificationTypes } from '@src/utils/constants';
import ApiKey from '@src/components/forms/manage/ApiKey.vue';
import FormSettings from '@src/components/designer/FormSettings.vue';
import ManageVersions from '@src/components/forms/manage/ManageVersions.vue';

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
        const { valid } = await this.$refs.settingsForm.validate();

        if (valid) {
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
