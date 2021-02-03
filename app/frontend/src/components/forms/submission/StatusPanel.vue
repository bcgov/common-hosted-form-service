<template>
  <div>
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-2"
    />
    <div v-else>
      <p>
        <strong>Current Status:</strong> Submitted
      </p>

      <v-form v-if="!error" ref="form" v-model="valid" lazy-validation>
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
              data-test="select-inspection-statusToSet"
              :rules="[(v) => !!v || 'Status is required']"
              @change="statusFields = true"
            />

            <div v-show="statusFields">
              <div v-if="showActionDate">
                <label>Effective Date (Optional)</label>
                <v-menu
                  v-model="actionDateMenu"
                  data-test="menu-inspection-actionDateMenu"
                  :close-on-content-click="true"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="actionDate"
                      data-test="text-inspection-actionDate"
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
                    data-test="picker-inspection-actionDate"
                    @input="actionDateMenu = false"
                  />
                </v-menu>
              </div>

              <div v-if="showInspector">
                <label>Assignee Name</label>
                <v-text-field
                  v-model="assignedTo"
                  data-test="text-inspection-assignedTo"
                  :rules="[(v) => !!v || 'Name is required']"
                  dense
                  flat
                  outlined
                  solo
                />

                <label>Assignee Email (Optional)</label>
                <v-text-field
                  v-model="assignedToEmail"
                  data-test="text-inspection-assignedToEmail"
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
                    data-test="btn-inspection-assign-self"
                  >
                    <v-icon class="mr-1">person</v-icon>
                    <span>ASSIGN TO ME</span>
                  </v-btn>
                </div>
              </div>

              <label>Note (Optional)</label>
              <v-textarea
                v-model="note"
                data-test="text-inspection-note"
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
                <v-btn
                  block
                  outlined
                  color="textLink"
                  data-test="btn-inspection-view-history"
                  v-on="on"
                >
                  <span>VIEW HISTORY</span>
                </v-btn>
              </template>

              <v-card v-if="historyDialog">
                <v-card-title class="headline grey lighten-3" primary-title>
                  Status History
                </v-card-title>

                <v-divider />
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    @click="historyDialog = false"
                    color="primary"
                    data-test="btn-inspection-close-status-table"
                    text
                  >
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
              data-test="btn-inspection-update-status"
              :disabled="!hasReviewer"
              v-on="on"
              @click="updateStatus"
            >
              <span>UPDATE</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatusPanel',
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      actionDateMenu: false,
      currentStatus: {},
      error: '',
      historyDialog: false,
      loading: false,
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
    }
  },
};
</script>
