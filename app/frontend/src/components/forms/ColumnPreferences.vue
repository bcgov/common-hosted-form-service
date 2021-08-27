<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          @click="openPrefs()"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>view_column</v-icon>
        </v-btn>
      </template>
      <span>Customize Columns</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title class="headline pb-0">Customize Columns</v-card-title>
        <v-card-text>
          <hr />
          <v-checkbox
            v-for="field in formFields"
            v-model="selectedFields"
            :key="field"
            :label="field"
            :value="field"
          />
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
      this.dialog = true;
      await this.fetchFormFields({
        formId: this.form.id,
        formVersionId: this.form.versions[0].id,
      });
      this.selectedFields =
        this.userFormPreferences && this.userFormPreferences.preferences
          ? this.userFormPreferences.preferences.columnList
          : [];
      this.loading = false;
    },
    saveColumns() {
      const userPrefs = {
        columnList: this.selectedFields,
      };
      this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: userPrefs,
      });
      this.dialog = false;
    },
  },
};
</script>
