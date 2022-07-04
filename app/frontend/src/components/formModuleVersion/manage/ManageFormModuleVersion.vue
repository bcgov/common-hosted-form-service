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
            <strong>Form Module Version Settings</strong>
            <span>
              <small>
                Created: {{ formModuleVersion.createdAt | formatDate }} ({{
                  formModuleVersion.createdBy
                }})
              </small>
            </span>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-form
            ref="settingsFormModuleVersion"
            v-model="settingsFormModuleVersionValid"
            lazy-validation
          >
            <FormModuleVersionSettings />
          </v-form>

          <div class="mb-5">
            <v-btn class="mr-5" color="primary" @click="updateSettings">
              <span>Update</span>
            </v-btn>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormModuleVersionSettings from '@/components/formModuleVersion/FormModuleVersionSettings.vue';
import { NotificationTypes } from '@/utils/constants';

export default {
  name: 'ManageFormModuleVersion',
  components: { FormModuleVersionSettings },
  data() {
    return {
      settingsFormModuleVersionValid: false,
      settingsPanel: 0,
    };
  },
  computed: {
    ...mapGetters('formModule', ['formModule', 'formModuleVersion']),
  },
  methods: {
    ...mapActions('formModule', ['updateFormModuleVersion', 'fetchFormModuleVersion']),
    ...mapActions('notifications', ['addNotification']),
    async updateSettings() {
      try {
        if (this.$refs.settingsFormModuleVersion.validate()) {
          await this.updateFormModuleVersion();
          this.addNotification({
            message: 'Your form module version settings have been updated successfully.',
            ...NotificationTypes.SUCCESS,
          });
          this.fetchFormModuleVersion({
            formModuleId: this.formModule.id,
            formModuleVersionId: this.formModuleVersion.id,
          });
        }
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while attempting to update the settings for this form module version.',
          consoleError: `Error updating settings for ${this.formModuleVersion.id}: ${error}`,
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
