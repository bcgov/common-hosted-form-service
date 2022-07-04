<template>
  <div>
    <v-expansion-panels
      v-model="settingsPanel"
      flat
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <!-- Form Settings -->
        <v-expansion-panel-header>
          <template v-slot:actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <strong>Form Module Settings</strong>
            <span>
              <small>
                Created: {{ formModule.createdAt | formatDate }} ({{
                  formModule.createdBy
                }})
              </small>
            </span>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-form
            ref="settingsFormModule"
            v-model="settingsFormModuleValid"
            lazy-validation
          >
            <FormModuleSettings />
          </v-form>

          <div class="mb-5">
            <v-btn class="mr-5" color="primary" @click="updateSettings">
              <span>Update</span>
            </v-btn>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Form Module Versioning -->
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
            <strong>Form Module Versions</strong>
            <div>
              <span>
                <strong>Total Versions:</strong>
                {{ versionCount }}
              </span>
            </div>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <ManageFormModuleVersions />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormModuleSettings from '@/components/formModule/FormModuleSettings.vue';
import ManageFormModuleVersions from '@/components/formModule/manage/ManageFormModuleVersions.vue';
import { NotificationTypes } from '@/utils/constants';
import { mapFields } from 'vuex-map-fields';

export default {
  name: 'ManageFormModule',
  components: { FormModuleSettings, ManageFormModuleVersions },
  data() {
    return {
      formModuleSettingsDisabled: true,
      settingsFormModuleValid: false,
      settingsPanel: 0,
      versionsPanel: 0,
    };
  },
  computed: {
    ...mapFields('formModule', [
      'formModule.pluginName',
      'formModule.identityProviders',
      'formModule.idpTypes',
    ]),
    ...mapGetters('formModule', ['formModule']),
    versionCount() {
      return (this.formModule && this.formModule.formModuleVersions) ? this.formModule.formModuleVersions.length : 0;
    },
    currentVersion() {
      let cv = 'N/A';
      return cv;
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('formModule', ['updateFormModule', 'fetchFormModule']),
    async updateSettings() {
      try {
        if (this.$refs.settingsFormModule.validate()) {
          await this.updateFormModule();
          this.addNotification({
            message: 'Your form module settings have been updated successfully.',
            ...NotificationTypes.SUCCESS,
          });
          this.fetchFormModule(this.formModule.id);
        }
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while attempting to update the settings for this form module.',
          consoleError: `Error updating settings for ${this.formModule.id}: ${error}`,
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
