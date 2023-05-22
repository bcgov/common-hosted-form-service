<template>
  <div>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <p>
        <strong>{{ $t('trans.statusPanel.currentStatus') }}</strong>
        {{ currentStatus.code }}
        <br />
        <strong>{{ $t('trans.statusPanel.assignedTo') }}</strong>
        {{ currentStatus.user ? currentStatus.user.fullName : 'N/A' }}
        <span v-if="currentStatus.user">({{ currentStatus.user.email }})</span>
      </p>

      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12">
            <label>{{ $t('trans.statusPanel.assignOrUpdateStatus') }}</label>
            <v-select
              dense
              outlined
              :items="items"
              item-text="display"
              item-value="code"
              v-model="statusToSet"
              :rules="[(v) => !!v || $t('trans.statusPanel.statusIsRequired')]"
              @change="onStatusChange(statusToSet)"
            />

            <div v-show="statusFields">
              <div v-if="showAsignee">
                <label>
                  Assign To
                  <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                      <v-icon color="primary" v-bind="attrs" v-on="on"
                        >help_outline</v-icon
                      >
                    </template>
                    <span
                      v-html="
                        $t('trans.statusPanel.assignSubmissnToFormReviewer')
                      "
                    >
                    </span>
                  </v-tooltip>
                </label>
                <v-autocomplete
                  autocomplete="autocomplete_off"
                  v-model="assignee"
                  clearable
                  dense
                  :filter="autoCompleteFilter"
                  :items="formReviewers"
                  :loading="loading"
                  :no-data-text="$t('trans.statusPanel.noDataText')"
                  outlined
                  return-object
                  :rules="[
                    (v) => !!v || $t('trans.statusPanel.assigneeIsRequired'),
                  ]"
                >
                  <!-- selected user -->
                  <template #selection="data">
                    <span
                      v-bind="data.attrs"
                      :input-value="data.selected"
                      close
                      @click="data.select"
                      @click:close="remove(data.item)"
                    >
                      {{ data.item.fullName }}
                    </span>
                  </template>
                  <!-- users found in dropdown -->
                  <template #item="data">
                    <div v-if="typeof data.item !== 'object'">
                      <v-list-item-content v-text="data.item" />
                    </div>
                    <div v-else>
                      <v-list-item-content>
                        <v-list-item-title v-html="data.item.fullName" />
                        <v-list-item-subtitle v-html="data.item.username" />
                        <v-list-item-subtitle v-html="data.item.email" />
                      </v-list-item-content>
                    </div>
                  </template>
                </v-autocomplete>
                <span v-if="assignee">Email: {{ assignee.email }}</span>

                <div class="text-right">
                  <v-btn
                    text
                    small
                    color="primary"
                    class="pl-0 my-0 text-end"
                    @click="assignToCurrentUser"
                  >
                    <v-icon class="mr-1">person</v-icon>
                    <span>{{ $t('trans.statusPanel.assignToMe') }}</span>
                  </v-btn>
                </div>
              </div>
              <div v-show="statusFields" v-if="showRevising">
                <v-text-field
                  v-model="submissionUserEmail"
                  :label="$t('trans.statusPanel.recipientEmail')"
                  outlined
                  dense
                />
              </div>

              <div v-if="showRevising || showAsignee || showCompleted">
                <v-checkbox
                  v-model="addComment"
                  :label="$t('trans.statusPanel.attachCommentToEmail')"
                />
                <div v-if="addComment">
                  <label>{{ $t('trans.statusPanel.emailComment') }}</label>
                  <v-textarea
                    v-model="emailComment"
                    :rules="[
                      (v) =>
                        v.length <= 4000 || $t('trans.statusPanel.maxChars'),
                    ]"
                    rows="1"
                    counter
                    auto-grow
                    dense
                    flat
                    outlined
                    solid
                  />
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" sm="6" xl="4">
            <v-dialog v-model="historyDialog" width="1200">
              <template #activator="{ on }">
                <v-btn block outlined color="textLink" v-on="on" id="btnText">
                  <span>{{ $t('trans.statusPanel.viewHistory') }}</span>
                </v-btn>
              </template>

              <v-card v-if="historyDialog">
                <v-card-title class="text-h5 pb-0">{{
                  $t('trans.statusPanel.statusHistory')
                }}</v-card-title>

                <v-card-text>
                  <hr />
                  <StatusTable :submissionId="submissionId" />
                </v-card-text>

                <v-card-actions class="justify-center">
                  <v-btn
                    @click="historyDialog = false"
                    class="mb-5 close-dlg"
                    color="primary"
                  >
                    <span>{{ $t('trans.statusPanel.close') }}</span>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>

          <v-col cols="12" sm="6" xl="4" order="first" order-sm="last">
            <v-btn
              block
              :disabled="!this.statusToSet"
              color="primary"
              v-on="on"
              @click="updateStatus"
            >
              <span>{{ statusAction }}</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-skeleton-loader>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { FormPermissions } from '@/utils/constants';
import { formService, rbacService } from '@/services';
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
      // TODO: use a better name than "on" if possible, check multiple usage in template though...
      on: false,
      assignee: null,
      addComment: false,
      currentStatus: {},
      formReviewers: [],
      historyDialog: false,
      items: [],
      loading: true,
      note: '',
      emailComment: '',
      submissionUserEmail: '',
      statusHistory: {},
      statusFields: false,
      statusToSet: '',
      valid: false,
      showSendConfirmEmail: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['identityProviderIdentity']),
    ...mapGetters('form', ['form', 'formSubmission', 'submissionUsers']),
    // State Machine
    showActionDate() {
      return ['ASSIGNED', 'COMPLETED'].includes(this.statusToSet);
    },
    showAsignee() {
      return ['ASSIGNED'].includes(this.statusToSet);
    },
    showCompleted() {
      return ['COMPLETED'].includes(this.statusToSet);
    },
    showRevising() {
      return ['REVISING'].includes(this.statusToSet);
    },
    statusAction() {
      const obj = Object.freeze({
        ASSIGNED: 'ASSIGN',
        COMPLETED: 'COMPLETE',
        REVISING: 'REVISE',
        DEFAULT: 'UPDATE',
      });

      let action = obj[this.statusToSet]
        ? obj[this.statusToSet]
        : obj['DEFAULT'];

      let actionStatus = '';
      switch (action) {
        case 'ASSIGN':
          actionStatus = this.$t('trans.statusPanel.assign');
          break;
        case 'COMPLETE':
          actionStatus = this.$t('trans.statusPanel.complete');
          break;
        case 'REVISE':
          actionStatus = this.$t('trans.statusPanel.revise');
          break;
        case 'UPDATE':
          actionStatus = this.$t('trans.statusPanel.update');
          break;
        default:
        // code block
      }
      return actionStatus;
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', ['fetchSubmissionUsers']),
    async onStatusChange(status) {
      this.statusFields = true;
      this.addComment = false;
      if (status === 'REVISING' || status === 'COMPLETED') {
        try {
          await this.fetchSubmissionUsers(this.submissionId);

          const submitterData = this.submissionUsers.data.find((data) => {
            const username = data.user.idpCode
              ? `${data.user.username}@${data.user.idpCode}`
              : data.user.username;
            return username === this.formSubmission.createdBy;
          });

          if (submitterData) {
            this.submissionUserEmail = submitterData.user
              ? submitterData.user.email
              : undefined;
            this.showSendConfirmEmail = status === 'COMPLETED';
          }
        } catch (error) {
          this.addNotification({
            message: this.$t('trans.statusPanel.fetchSubmissionUsersErr'),
            consoleError:
              this.$t('trans.statusPanel.fetchSubmissionUsersConsErr') +
              `${this.submissionId}: ${error}`,
          });
        }
      }
    },
    assignToCurrentUser() {
      this.assignee = this.formReviewers.find(
        (f) => f.idpUserId === this.identityProviderIdentity
      );
    },
    autoCompleteFilter(item, queryText) {
      return (
        item.fullName
          .toLocaleLowerCase()
          .includes(queryText.toLocaleLowerCase()) ||
        item.username
          .toLocaleLowerCase()
          .includes(queryText.toLocaleLowerCase())
      );
    },
    async getStatus() {
      this.loading = true;
      try {
        // Prepopulate the form reviewers (people with submission read on this form)
        const rbacUsrs = await rbacService.getFormUsers({
          formId: this.formId,
          permissions: FormPermissions.SUBMISSION_READ,
        });
        this.formReviewers = rbacUsrs.data.sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );

        // Get submission status
        const statuses = await formService.getSubmissionStatuses(
          this.submissionId
        );

        this.$emit('draft-enabled', statuses.data[0].code);

        this.statusHistory = statuses.data;
        if (!this.statusHistory.length || !this.statusHistory[0]) {
          throw new Error(this.$t('trans.statusPanel.noStatusesFound'));
        } else {
          // Statuses are returned in date precedence, the 0th item in the array is the current status
          this.currentStatus = this.statusHistory[0];

          // Get the codes that this form is associated with
          const scRes = await formService.getStatusCodes(this.formId);
          const statusCodes = scRes.data;
          if (!statusCodes.length) {
            throw new Error(this.$t('trans.statusPanel.statusCodesErr'));
          }
          // For the CURRENT status, add the code details (display name, next codes etc)
          this.currentStatus.statusCodeDetail = statusCodes.find(
            (sc) => sc.code === this.currentStatus.code
          ).statusCode;
          this.items = this.currentStatus.statusCodeDetail.nextCodes;
        }
        if (!this.form.enableSubmitterDraft) {
          this.items = this.items.filter((item) => item !== 'REVISING');
        }
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.statusPanel.notifyErrorCode'),
          consoleError:
            this.$t('trans.statusPanel.notifyConsoleErrorCode') +
            `${error.message}`,
        });
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.addComment = false;
      this.emailComment = '';
      this.statusFields = false;
      this.$refs.form.resetValidation();
      this.submissionUserEmail = '';
      this.statusToSet = null;
      this.note = '';
    },
    async updateStatus() {
      try {
        if (this.$refs.form.validate()) {
          if (!this.statusToSet) {
            throw new Error(this.$t('trans.statusPanel.status'));
          }

          const statusBody = {
            code: this.statusToSet,
            submissionUserEmail: this.submissionUserEmail,
            revisionNotificationEmailContent: this.emailComment,
          };
          if (this.showAsignee) {
            if (this.assignee) {
              statusBody.assignedToUserId = this.assignee.userId;
              statusBody.assignmentNotificationEmail = this.assignee.email;
            }
          }
          const statusResponse = await formService.updateSubmissionStatus(
            this.submissionId,
            statusBody
          );
          if (!statusResponse.data) {
            throw new Error(
              this.$t('trans.statusPanel.updtSubmissionsStatusErr')
            );
          }

          if (this.emailComment) {
            let formattedComment;
            if (this.statusToSet === 'ASSIGNED') {
              formattedComment = `Email to ${this.assignee.email}: ${this.emailComment}`;
            } else if (
              this.statusToSet === 'REVISING' ||
              this.statusToSet === 'COMPLETED'
            ) {
              formattedComment = `Email to ${this.submissionUserEmail}: ${this.emailComment}`;
            }

            const submissionStatusId =
              statusResponse.data[0].submissionStatusId;
            const user = await rbacService.getCurrentUser();
            const noteBody = {
              submissionId: this.submissionId,
              submissionStatusId: submissionStatusId,
              note: formattedComment,
              userId: user.data.id,
            };
            const response = await formService.addNote(
              this.submissionId,
              noteBody
            );
            if (!response.data) {
              throw new Error(
                this.$t('trans.statusPanel.addNoteNoReponserErr')
              );
            }
            // Update the parent if the note was updated
            this.$emit('note-updated');
          }
          this.resetForm();
          this.getStatus();
        }
      } catch (error) {
        /* eslint-disable no-console */
        console.error(
          `${this.$t('trans.statusPanel.addNoteConsoleErrMsg', {
            error: error,
          })}`
        ); // eslint-disable-line no-console
        this.error = this.$t('trans.statusPanel.addNoteErrMsg');
      }
    },
  },
  created() {
    this.getStatus();
  },
};
</script>

<style>
.v-btn__content {
  width: 100%;
  white-space: normal;
}
</style>
