<template>
  <div>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <p>
        <strong>Current Status:</strong>
        {{ currentStatus.code }}
        <br />
        <strong>Assigned To:</strong>
        {{ currentStatus.assignedTo ? currentStatus.assignedTo : 'N/A' }}
        <span v-if="currentStatus.assignedToEmail">
          ({{ currentStatus.assignedToEmail }})
        </span>
        <br />
        <strong>Effective Date:</strong>
        <span v-if="currentStatus.actionDate">
          {{ currentStatus.actionDate | formatDate }}
        </span>
        <span v-else> N/A </span>
      </p>

      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12">
            <label>Update Status</label>
            <v-select
              dense
              outlined
              label="Select status to set"
              :items="items"
              item-text="display"
              item-value="code"
              v-model="statusToSet"
              :rules="[(v) => !!v || 'Status is required']"
              @change="statusFields = true"
            />

            <div v-show="statusFields">
              <div v-if="showActionDate">
                <label>Effective Date (Optional)</label>
                <v-menu
                  v-model="actionDateMenu"
                  :close-on-content-click="true"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="actionDate"
                      placeholder="yyyy-mm-dd"
                      append-icon="event"
                      v-on:click:append="actionDateMenu = true"
                      readonly
                      v-on="on"
                      dense
                      outlined
                    />
                  </template>
                  <v-date-picker
                    v-model="actionDate"
                    @input="actionDateMenu = false"
                  />
                </v-menu>
              </div>

              <div v-if="showInspector">
                <label>Assignee Name</label>
                <v-text-field
                  v-model="assignedTo"
                  :rules="[(v) => !!v || 'Name is required']"
                  dense
                  flat
                  solid
                  outlined
                />

                <label>Assignee Email (Optional)</label>
                <v-text-field
                  v-model="assignedToEmail"
                  dense
                  flat
                  outlined
                  solid
                />

                <div class="text-right">
                  <v-btn
                    text
                    small
                    color="primary"
                    class="pl-0 my-0 text-end"
                    @click="assignToCurrentUser"
                  >
                    <v-icon class="mr-1">person</v-icon>
                    <span>ASSIGN TO ME</span>
                  </v-btn>
                </div>
              </div>

              <label>Note (Optional)</label>
              <v-textarea
                v-model="note"
                :rules="[(v) => v.length <= 4000 || 'Max 4000 characters']"
                rows="1"
                counter
                auto-grow
                dense
                flat
                outlined
                solid
              />
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" sm="6" xl="4">
            <v-dialog v-model="historyDialog" width="1200">
              <template v-slot:activator="{ on }">
                <v-btn block outlined color="textLink" v-on="on">
                  <span>VIEW HISTORY</span>
                </v-btn>
              </template>

              <v-card v-if="historyDialog">
                <v-card-title class="headline grey lighten-3" primary-title>
                  Status History
                </v-card-title>

                <StatusTable :submissionId="submissionId" />

                <v-divider />
                <v-card-actions>
                  <v-spacer />
                  <v-btn @click="historyDialog = false" color="primary" text>
                    <span>CLOSE</span>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>

          <v-col cols="12" sm="6" xl="4" order="first" order-sm="last">
            <v-btn block color="primary" v-on="on" @click="updateStatus">
              <span>UPDATE</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-skeleton-loader>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import formService from '@/services/formService';
import StatusTable from '@/components/forms/submission/StatusTable';

export default {
  name: 'StatusPanel',
  props: {
    formId: {
      type: String,
      required: true,
    },
    submissionId: {
      type: String,
      required: true,
    },
  },
  components: {
    StatusTable,
  },
  data() {
    return {
      on: false,
      actionDateMenu: false,
      currentStatus: {},
      historyDialog: false,
      items: [],
      loading: true,
      statusHistory: {},
      statusFields: false,
      statusToSet: '',
      valid: false,

      // Fields
      assignedTo: this.currentStatus ? this.currentStatus.assignedTo : '',
      assignedToEmail: this.currentStatus
        ? this.currentStatus.assignedToEmail
        : '',
      actionDate: '',
      note: '',
    };
  },
  computed: {
    ...mapGetters('auth', ['hasResourceRoles', 'email', 'token', 'fullName']),

    // State Machine
    showInspector() {
      return ['ASSIGNED'].includes(this.statusToSet);
    },
    showActionDate() {
      return ['ASSIGNED', 'COMPLETED'].includes(this.statusToSet);
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    assignToCurrentUser() {
      this.assignedTo = this.fullName;
      this.assignedToEmail = this.email;
    },
    async getStatus() {
      this.loading = true;
      try {
        const statuses = await formService.getSubmissionStatuses(
          this.submissionId
        );
        this.statusHistory = statuses.data;
        if (!this.statusHistory.length || !this.statusHistory[0]) {
          throw new Error('No statuses found');
        } else {
          // Statuses are returned in date precedence, the 0th item in the array is the current status
          this.currentStatus = this.statusHistory[0];

          // Get the codes that this form is associated with
          const scRes = await formService.getStatusCodes(this.formId);
          const statusCodes = scRes.data;
          if (!statusCodes.length) {
            throw new Error('error finding status codes');
          }
          // For the CURRENT status, add the code details (display name, next codes etc)
          this.currentStatus.statusCodeDetail = statusCodes.find(
            (sc) => sc.code === this.currentStatus.code
          ).statusCode;
          this.items = this.currentStatus.statusCodeDetail.nextCodes;
        }
      } catch (error) {
        this.addNotification({
          message: 'Error occured fetching status for this submission.',
          consoleError: `Error getting statuses: ${error.message}`,
        });
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.statusFields = false;
      this.$refs.form.resetValidation();
      this.statusToSet = null;
      this.statusFields = false;
      this.note = '';
    },
    async updateStatus() {
      try {
        if (this.$refs.form.validate()) {
          if (!this.statusToSet) {
            throw new Error('No Status');
          }

          const statusBody = {
            code: this.statusToSet,
          };
          if (this.showInspector) {
            if (this.assignedTo) {
              statusBody.assignedTo = this.assignedTo;
            }
            if (this.assignedToEmail) {
              statusBody.assignedToEmail = this.assignedToEmail;
            }
          }
          if (this.actionDate && this.showActionDate) {
            statusBody.actionDate = this.actionDate;
          }
          const statusResponse = await formService.updateSubmissionStatus(
            this.submissionId,
            statusBody
          );
          if (!statusResponse.data) {
            throw new Error(
              'No response data from API while submitting status update form'
            );
          }
          if (this.note) {
            const submissionStatusId =
              statusResponse.data[0].submissionStatusId;
            const noteBody = {
              submissionId: this.submissionId,
              submissionStatusId: submissionStatusId,
              note: this.note,
            };
            const response = await formService.addNote(
              this.submissionId,
              noteBody
            );
            if (!response.data) {
              throw new Error(
                'No response data from API while submitting note for status update'
              );
            }
            // Update the parent if the note was updated
            this.$emit('note-updated');
          }
          this.resetForm();
          this.getStatus();
        }
      } catch (error) {
        console.error(`Error updating status: ${error}`); // eslint-disable-line no-console
        this.error = 'An error occured while trying to update the status';
      }
    },
  },
  created() {
    this.getStatus();
  },
};
</script>
