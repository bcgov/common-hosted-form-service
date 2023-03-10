<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Submissions</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <ColumnPreferences @preferences-saved="populateSubmissionsTable" />

        <span v-if="checkFormManage">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>settings</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Manage Form</span>
          </v-tooltip>
        </span>
        <ExportSubmissions />
        <span v-if="selectedSubmissionToDelete.length>0">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                class="mx-1"
                color="red"
                icon
                @click="showDeleteSubmissionDialog=true, singleSubmissionDelete=false"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            <span>delete selected submissions</span>
          </v-tooltip>
        </span>
      </v-col>
    </v-row>


    <v-row no-gutters class="mt-3 mb-4">

      <!---->
      <v-spacer />
      <v-col cols="6" sm="6" >
        <v-switch
          v-model="switchSubmissionView"
          :label="switchSubmissionViewMessage"
          :input-value="true"
          @change="onSwitchSubmissionView"
          small
          color="sucess"
          hide-details
          class="mt-5"
        ></v-switch>
      </v-col>

      <v-col cols="6" sm="6">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            class="pb-5"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="calcHeaders"
      item-key="submissionId"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      :show-select="!switchSubmissionView"
      v-model="selectedSubmissionToDelete"
      loading-text="Loading... Please wait"
      no-data-text="There are no submissions for this form"
    >

      <template #[`item.date`]="{ item }">
        {{ item.date | formatDateLong }}
      </template>
      <template #[`item.status`]="{ item }">
        {{ item.status }}
      </template>
      <template #[`item.actions`]="{ item }">
        <span>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{
                  name: 'FormView',
                  query: {
                    s: item.submissionId,
                  },
                }"
              >
                <v-btn color="primary" icon v-bind="attrs" v-on="on">
                  <v-icon>remove_red_eye</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>View Submission</span>
          </v-tooltip>
          <v-tooltip bottom v-if="!item.deleted">
            <template #activator="{ on, attrs }">
              <v-btn
                @click="showDeleteSubmissionDialog=true,
                        selectedSubmissionIdToDelete=item.submissionId, singleSubmissionDelete=true"
                color="red"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>remove_circle</v-icon>
              </v-btn>
            </template>
            <span>Delete Submission</span>
          </v-tooltip>
        </span>
        <span v-if="item.deleted">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                @click="restoreItem=item; showRestoreDialog = true"
                color="red"
                icon
                v-bind="attrs"
                v-on="on">
                <v-icon>restore_from_trash</v-icon>
              </v-btn>
            </template>
            <span>Restore</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDeleteSubmissionDialog"
      type="CONTINUE"
      @close-dialog="showDeleteSubmissionDialog = false"
      @continue-dialog="delSub"
    >
      <template #title>Confirm Deletion</template>
      <template #text>
        {{singleSubmissionDelete?singleDeleteMessage:multiDeleteMessage}}
      </template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restoreSub"
    >
      <template #title>Confirm Restoration</template>
      <template #text>
        Are you sure you wish to restore this submission?
      </template>
      <template #button-text-continue>
        <span>Restore</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { FormManagePermissions, NotificationTypes } from '@/utils/constants';

import ColumnPreferences from '@/components/forms/ColumnPreferences.vue';
import ExportSubmissions from '@/components/forms/ExportSubmissions.vue';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faTrash);


export default {
  name: 'SubmissionsTable',
  components: {
    ColumnPreferences,
    ExportSubmissions,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      deletedOnly: false,
      currentUserOnly: false,
      loading: true,
      restoreItem: {},
      search: '',
      showRestoreDialog: false,
      submissionTable: [],
      submissionsCheckboxes:[],
      showDeleteSubmissionDialog:false,
      selectedSubmissionToDelete: [],
      multiDeleteMessage:'Are you sure you wish to delete selected submissions',
      singleDeleteMessage: 'Are you sure you wish to delete this submission',
      singleSubmissionDelete:false,
      selectedSubmissionIdToDelete:'',
      switchSubmissionView:false,
      switchSubmissionViewMessage: 'Show Deleted submissions'
    };
  },
  computed: {
    ...mapGetters('form', [
      'form',
      'formFields',
      'permissions',
      'submissionList',
      'userFormPreferences',
      'roles',
      'deletedSubmissions',
    ]),
    ...mapGetters('auth', [
      'user'
    ]),

    checkFormManage() {
      return this.permissions.some((p) => FormManagePermissions.includes(p));
    },

    calcHeaders() {
      let headers = [
        { text: 'Confirmation ID', align: 'start', value: 'confirmationId' },
        { text: 'Submission Date', align: 'start', value: 'date' },
        { text: 'Submitter', align: 'start', value: 'submitter' },
      ];

      // If status flow enabled add that column
      if (this.showStatus) {
        headers.splice(3, 0, {
          text: 'Status',
          align: 'start',
          value: 'status',
        });
      }

      // Add any custom columns if the user has them
      const maxHeaderLength = 25;
      this.userColumns.forEach((col) => {
        headers.push({
          text:
            col.length > maxHeaderLength
              ? `${col.substring(0, maxHeaderLength)}...`
              : col,
          align: 'end',
          value: col,
        });
      });

      // Actions column at the end
      headers.push({
        text: 'Actions',
        align: 'end',
        value: 'actions',
        filterable: false,
        sortable: false,
      });

      return headers.filter(
        (x) => x.value !== 'updatedAt' || this.deletedOnly
      );
    },

    showStatus() {
      return this.form && this.form.enableStatusUpdates;
    },
    userColumns() {
      if (
        this.userFormPreferences &&
        this.userFormPreferences.preferences &&
        this.userFormPreferences.preferences.columns
      ) {
        // Compare saved user prefs against the current form versions component names and remove any discrepancies
        return this.userFormPreferences.preferences.columns.filter(
          (x) => this.formFields.indexOf(x) !== -1
        );
      } else {
        return [];
      }
    },
  },
  methods: {
    ...mapActions('form', [
      'fetchForm',
      'fetchFormFields',
      'fetchSubmissions',
      'restoreSubmission',
      'getFormPermissionsForUser',
      'getFormRolesForUser',
      'getFormPreferencesForCurrentUser',
      'deleteMultiSubmissions',
      'deleteSubmission'
    ]),
    ...mapActions('notifications', ['addNotification']),
    onSwitchSubmissionView() {
      //this.switchSubmissionView = !this.switchSubmissionView;
      if(this.switchSubmissionView) {
        this.deletedOnly = true;
        this.currentUserOnly =false;
        this.switchSubmissionViewMessage= 'Show my submissions';
      }
      else {
        this.deletedOnly = false;
        this.currentUserOnly = true;
        this.switchSubmissionViewMessage= 'Show Deleted submissions';
      }
      this.refreshSubmissions();
    },
    async delSub() {
      this.singleSubmissionDelete?this.deleteSingleSubs():this.deleteMultiSubs();
    },
    async deleteSingleSubs() {
      this.showDeleteSubmissionDialog = false;
      await this.deleteSubmission(this.selectedSubmissionIdToDelete);
      await this.populateSubmissionsTable();
      this.selectedSubmissionToDelete = [];
    },
    async deleteMultiSubs() {
      let submissionsIdsToDelete = this.selectedSubmissionToDelete.map(submission=>submission.submissionId);
      this.showDeleteSubmissionDialog = false;
      await this.deleteMultiSubmissions(submissionsIdsToDelete);
      let notDeletedSubmissionIds = this.deletedSubmissions&&this.deletedSubmissions.filter(submission=>{
        if(!submission.deleted) return submission.id;
      });

      if (notDeletedSubmissionIds.length>0){
        this.addNotification({
          message: `These submissions with submission Ids ${notDeletedSubmissionIds} were not deleted`,
          consoleError: `Cannot delete selected submissions with submission ids ${notDeletedSubmissionIds}`,
        });
      }
      else {
        await this.populateSubmissionsTable();
        this.addNotification({
          message: 'Submission(s) deleted successfully',
          ...NotificationTypes.SUCCESS,
        });
      }
      this.selectedSubmissionToDelete = [];
    },

    async populateSubmissionsTable() {
      try {
        this.loading = true;
        // Get user prefs for this form
        await this.getFormPreferencesForCurrentUser(this.formId);
        // Get the submissions for this form
        await this.fetchSubmissions({ formId: this.formId, deletedOnly: this.deletedOnly, createdBy: (this.currentUserOnly) ? `${this.user.username}@${this.user.idp}` : '' });
        // Build up the list of forms for the table
        if (this.submissionList) {
          const tableRows = this.submissionList
            // Filtering out all submissions that has no status. (User has not submitted)
            .filter((s) => s.formSubmissionStatusCode)
            .map((s) => {
              const fields = {
                confirmationId: s.confirmationId,
                date: s.createdAt,
                formId: s.formId,
                status: s.formSubmissionStatusCode,
                submissionId: s.submissionId,
                submitter: s.createdBy,
                versionId: s.formVersionId,
                deleted: s.deleted,
              };
              // Add any custom columns
              this.userColumns.forEach((col) => {
                fields[col] = s[col];
              });
              return fields;
            });
          this.submissionTable = tableRows;
          this.submissionsCheckboxes= new Array(this.submissionTable.length).fill(false);
        }
      } catch (error) {
        // Handled in state fetchSubmissions
      } finally {
        this.loading = false;
      }
    },

    async refreshSubmissions() {
      this.loading = true;
      Promise.all([
        this.getFormRolesForUser(this.formId),
        this.getFormPermissionsForUser(this.formId),
        this.fetchForm(this.formId).then(() => {
          this.fetchFormFields({
            formId: this.formId,
            formVersionId: this.form.versions[0].id,
          });
        }),
      ]).then(() => {
        this.populateSubmissionsTable();
      });
    },

    async restoreSub() {
      await this.restoreSubmission({ submissionId: this.restoreItem.submissionId, deleted: false });
      this.showRestoreDialog = false;
      this.refreshSubmissions();
    },
  },

  mounted() {
    this.refreshSubmissions();
  },
};
</script>

<style scoped>
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
