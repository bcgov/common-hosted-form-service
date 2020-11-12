<template>
  <div>
    <v-row class="my-6" no-gutters>
      <v-col cols="12" sm="6">
        <h1>Manage Form</h1>
      </v-col>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="6">
        <span>
          <ShareForm :formId="f" :versionId="currentVersion.id" />
        </span>

        <span v-if="canManageTeam">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link :to="{ name: 'FormTeams', query: { f: f } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>group</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Team Management</span>
          </v-tooltip>
        </span>

        <span v-if="canDeleteForm">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                class="mx-1"
                color="red"
                @click="showDeleteDialog = true"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            <span>Delete Form</span>
          </v-tooltip>

          <BaseDialog
            v-model="showDeleteDialog"
            type="CONTINUE"
            @close-dialog="showDeleteDialog = false"
            @continue-dialog="deleteForm"
          >
            <template #title>Confirm Deletion</template>
            <template #text>
              Are you sure you wish to delete
              <strong>{{ form.name }}</strong
              >? This form will no longer be accessible.
            </template>
            <template #button-text-continue>
              <span>Delete</span>
            </template>
          </BaseDialog>
        </span>
      </v-col>
    </v-row>

    <v-expansion-panels
      v-model="settingsPanel"
      flat
      class="nrmc-expand-collapse"
    >
      <v-expansion-panel flat>
        <v-expansion-panel-header>
          <template v-slot:actions>
            <v-icon class="icon">$expand</v-icon>
          </template>
          <div class="header">
            <span>Form Settings</span>
            <span>
              <small>
                Created: {{ form.createdAt | formatDate }} ({{
                  form.createdBy
                }})
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
            <v-btn
              :disabled="formSettingsDisabled"
              class="mr-5"
              color="primary"
              @click="updateSettings"
            >
              <span>Update</span>
            </v-btn>
            <v-btn
              :disabled="formSettingsDisabled"
              outlined
              @click="cancelSettingsEdit"
            >
              <span>Cancel</span>
            </v-btn>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

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
            <span>Form Design</span>
            <span>
              <small>
                Last Updated:
                {{ currentVersion.updatedAt | formatDateLong }}
                <span v-if="currentVersion.updatedBy">
                  ({{ currentVersion.updatedBy }})
                </span>
              </small>
            </span>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <p>
            <strong>Current Version:</strong>
            {{ currentVersion.version }}
            <router-link
              :to="{
                name: 'FormDesigner',
                query: { f: f, v: currentVersion.id },
              }"
            >
              <v-btn v-if="canCreateDesign" color="primary" text small>
                <v-icon class="mr-1">edit</v-icon>
                <span>Edit Current Design</span>
              </v-btn>
            </router-link>
          </p>

          <BaseInfoCard>
            Editing this form design and saving the changes will create and
            publish a new version. Any submissions made to previous versions
            will maintain the design of the form at the time of that submission.
          </BaseInfoCard>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import { FormPermissions, NotificationTypes } from '@/utils/constants';
import FormSettings from '@/components/designer/FormSettings.vue';
import ShareForm from '@/components/forms/ShareForm.vue';

export default {
  name: 'FormManage',
  components: { ShareForm, FormSettings },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      deleteDialog: false,
      formSettingsDisabled: true,
      showDeleteDialog: false,
      settingsFormValid: false,
      settingsPanel: 0,
      versionsPanel: 0,
    };
  },
  computed: {
    ...mapGetters('auth', ['isAdmin']),
    ...mapGetters('form', ['form', 'permissions']),

    // Permission checks, for right now some of these are restriced to app admins only until a later release
    canCreateDesign() {
      return this.permissions.includes(FormPermissions.DESIGN_CREATE);
    },
    canDeleteForm() {
      return this.permissions.includes(FormPermissions.FORM_DELETE);
    },
    canEditForm() {
      return this.permissions.includes(FormPermissions.FORM_UPDATE);
    },
    canManageTeam() {
      return (
        this.isAdmin && this.permissions.includes(FormPermissions.TEAM_READ)
      );
    },

    currentVersion() {
      return this.form.versions ? this.form.versions[0] : {};
    },
  },
  methods: {
    ...mapActions('form', [
      'deleteCurrentForm',
      'getFormPermissionsForUser',
      'fetchForm',
      'updateForm',
    ]),
    ...mapActions('notifications', ['addNotification']),
    cancelSettingsEdit() {
      this.formSettingsDisabled = true;
      this.fetchForm(this.f);
    },
    deleteForm() {
      this.showDeleteDialog = false;
      this.deleteCurrentForm();
      this.$router.push({
        name: 'UserForms',
      });
    },
    enableSettingsEdit() {
      if (this.settingsPanel === undefined) this.settingsPanel = 0;
      this.formSettingsDisabled = false;
    },
    async updateSettings() {
      try {
        if (this.$refs.settingsForm.validate()) {
          await this.updateForm();
          this.formSettingsDisabled = true;
          this.addNotification({
            type: NotificationTypes.SUCCESS,
            message: 'Your form settings have been updated successfully.',
          });
          this.fetchForm(this.f);
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
  mounted() {
    // Get the form for this management page
    this.fetchForm(this.f);
    // Get the permissions for this form
    this.getFormPermissionsForUser(this.f);
  },
};
</script>
