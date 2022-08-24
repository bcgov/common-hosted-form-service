<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <span v-bind="attrs" v-on="on">
          <v-btn
            class="mx-1"
            @click="openPrefs()"
            color="primary"
            :disabled="!canSetColumnPrefs"
            icon
          >
            <v-icon>view_column</v-icon>
          </v-btn>
        </span>
      </template>
      <span v-if="canSetColumnPrefs">Select Columns</span>
      <span v-else>No published form version</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title class="text-h5 pb-0">Select Columns</v-card-title>
        <v-card-text>
          <hr />
          <v-skeleton-loader :loading="loading" type="list-item-three-line">
            <div>
              <v-checkbox
                v-for="field in formFields"
                v-model="selectedFields"
                dense
                hide-details
                :key="field"
                :label="field"
                :value="field"
              />
            </div>
          </v-skeleton-loader>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 mr-5" color="primary" @click="saveColumns">
            <span>Save</span>
          </v-btn>
          <v-btn class="mb-5" outlined @click="dialog = false">
            <span>Cancel</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      dialog: false,
      loading: true,
      selectedFields: [],
    };
  },
  computed: {
    ...mapGetters('form', ['form', 'formFields', 'userFormPreferences']),
    canSetColumnPrefs() {
      return this.form.versions && this.form.versions[0];
    },
    fileName() {
      return `${this.form.snake}_submissions.${this.exportFormat}`;
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', [
      'fetchFormFields',
      'updateFormPreferencesForCurrentUser',
    ]),
    async openPrefs() {
      this.loading = true;
      this.dialog = true;
      await this.fetchFormFields({
        formId: this.form.id,
        formVersionId: this.form.versions[0].id,
      });
      this.selectedFields =
        this.userFormPreferences && this.userFormPreferences.preferences
          ? this.userFormPreferences.preferences.columnList.filter(x => this.formFields.indexOf(x) !== -1)
          : [];
      this.loading = false;
    },
    async saveColumns() {
      const userPrefs = {
        columnList: this.selectedFields,
      };
      this.loading = true;
      await this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: userPrefs,
      });
      // Update the parent if the note was updated
      this.$emit('preferences-saved');
      this.dialog = false;
    },
  },
};
</script>
