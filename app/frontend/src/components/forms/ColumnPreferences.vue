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
            
        <v-row class="ml-4">
          <v-col cols="12" class="mt-5"><template>Filter By Date</template></v-col>
          <v-col cols="5" class="pt-0">
            <v-menu
              v-model="openSubmissionDateDraw"
              data-test="menu-form-openSubmissionDateDraw"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  dense
                  flat
                  solid
                  outlined
                  v-model="filterFromDate"
                  placeholder="yyyy-mm-dd"
                  append-icon="event"
                  v-on:click:append="openSubmissionDateDraw = true"
                  readonly
                  label="From Date"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="filterFromDate"
                data-test="picker-form-openSubmissionDateDraw"
                @input="openSubmissionDateDraw = false"
              ></v-date-picker>
            </v-menu>
          </v-col>

          <v-col cols="6" class="pt-0">
            <v-menu
              v-model="closeSubmissionDateDraw"
              data-test="menu-form-closeSubmissionDateDraw"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  dense
                  flat
                  solid
                  outlined
                  v-model="filterToDate"
                  placeholder="yyyy-mm-dd"
                  append-icon="event"
                  v-on:click:append="closeSubmissionDateDraw = true"
                  readonly
                  label="To Date"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="filterToDate"
                data-test="picker-form-closeSubmissionDateDraw"
                @input="closeSubmissionDateDraw = false"
              ></v-date-picker>
            </v-menu>
          </v-col>
        </v-row>

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
import moment from 'moment';

export default {
  data() {
    return {
      dialog: false,
      loading: true,
      selectedFields: [],
      closeSubmissionDateDraw:false,
      openSubmissionDateDraw:false,
      filterFromDate:null,
      filterToDate:null
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
        this.userFormPreferences && this.userFormPreferences.preferences && this.userFormPreferences.preferences.columnList
          ? this.userFormPreferences.preferences.columnList.filter(x => this.formFields.indexOf(x) !== -1)
          : [];

      this.filterFromDate = this.userFormPreferences && this.userFormPreferences.preferences && this.userFormPreferences.preferences.filter ? moment(this.userFormPreferences.preferences.filter[0]).format('YYYY-MM-DD') : null;
      this.filterToDate = this.userFormPreferences && this.userFormPreferences.preferences && this.userFormPreferences.preferences.filter ? moment(this.userFormPreferences.preferences.filter[1]).format('YYYY-MM-DD') : null;
      this.loading = false;
    },
    async saveColumns() {
      const userPrefs = {
        columnList: this.selectedFields,
        filter:Object.values({
          minDate:moment(this.filterFromDate, 'YYYY-MM-DD hh:mm:ss').utc().format(),
          maxDate:moment(this.filterToDate, 'YYYY-MM-DD hh:mm:ss').utc().format(),
        })
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
