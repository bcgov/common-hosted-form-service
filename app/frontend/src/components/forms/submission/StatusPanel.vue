<template>
  <div>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <p>
        <strong>Current Status:</strong> {{ currentStatus.code }}
        <br />
        <strong>Assigned To:</strong>
        {{ currentStatus.assignedTo ? currentStatus.assignedTo : 'N/A' }}
        <span
          v-if="currentStatus.assignedToEmail"
        >({{ currentStatus.assignedToEmail }})</span>
        <br />
        <strong>Effective Date:</strong>
      </p>

      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12">
            <label>Update Status</label>
            <v-select
              block
              dense
              flat
              outlined
              solo
              single-line
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
                      flat
                      outlined
                      solo
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
                  outlined
                  solo
                />

                <label>Assignee Email (Optional)</label>
                <v-text-field
                  v-model="assignedToEmail"
                  dense
                  flat
                  outlined
                  solo
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
                solo
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
            <v-btn
              block
              color="primary"
              v-on="on"
              @click="updateStatus"
            >
              <span>UPDATE</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-skeleton-loader>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

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
      loading: true,
      showActionDate: false,
      showInspector: false,
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
    items() {
      return ['ASSIGNED'];
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    assignToCurrentUser() {
      alert('tbd');
    },
    updateStatus() {
      alert('tbd');
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
          const scRes = await formService.getStatusCodes(this.formId);
          const statusCodes = scRes.data;
          if (!statusCodes.length) {
            throw new Error('error finding status codes');
          }
          this.currentStatus.statusCodeDetail = statusCodes.find(
            (sc) => sc.code === this.currentStatus.code
          );
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
  },
  created() {
    this.getStatus();
  },
};
</script>
