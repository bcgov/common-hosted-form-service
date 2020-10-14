<template>
  <div>
    <v-row no-gutters class="mb-5">
      <v-col cols="12" sm="8">
        <h1>Manage Form</h1>
      </v-col>
      <v-col cols="12" sm="4" class="text-sm-right">
        <span class="ml-5">
          <ShareForm :formId="f" :versionId="currentVersion.id" />
        </span>

        <span class="ml-5">
          <router-link :to="{ name: 'FormTeams', query: { f: f } }">
            <v-btn icon color="primary">
              <v-icon>group</v-icon>
            </v-btn>
          </router-link>
        </span>

        <span class="ml-5">
          <v-btn icon color="red">
            <v-icon>delete</v-icon>
          </v-btn>
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
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-expansion-panels
      v-model="versionsPanel"
      flat
      class="nrmc-expand-collapse mt-5"
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
              <v-btn color="primary" text small>
                <v-icon class="mr-1 ml-5">edit</v-icon>
                <span>Edit Current Form</span>
              </v-btn>
            </router-link>
          </p>

          <BaseInfoCard>
            Editing this form and saving the changes will create and publish a
            new version. Any submissions made to previous versions will maintain
            the design of the form at the time of that submission.
          </BaseInfoCard>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import { NotificationTypes } from '@/utils/constants';
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
      formSettingsDisabled: true,
      settingsFormValid: false,
      settingsPanel: 0,
      versionsPanel: 0,
    };
  },
  computed: {
    ...mapGetters('form', ['form']),
    breadcrumbs() {
      const path = [
        {
          text: 'Form',
        },
      ];
      if (this.$route.meta.breadcrumbTitle) {
        path.push({
          text: this.$route.meta.breadcrumbTitle,
        });
      }
      return path;
    },
    currentVersion() {
      return this.form.versions ? this.form.versions[0] : {};
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm']),
    ...mapActions('notifications', ['addNotification']),
    cancelSettingsEdit() {
      this.formSettingsDisabled = true;
      this.fetchForm(this.f);
    },
    enableSettingsEdit() {
      if (this.settingsPanel === undefined) this.settingsPanel = 0;
      this.formSettingsDisabled = false;
    },
    updateSettings() {
      try {
        if (this.$refs.settingsForm.validate()) {
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
    this.fetchForm(this.f);
  },
};
</script>
