<script>
import { mapActions, mapState } from 'pinia';
import { i18n } from '~/internationalization';

import StatusTable from '~/components/forms/submission/StatusTable.vue';
import { formService, rbacService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions } from '~/utils/constants';

export default {
  components: {
    StatusTable,
  },
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
  emits: ['draft-enabled', 'note-updated'],
  data() {
    return {
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
    ...mapState(useAuthStore, ['identityProviderIdentity']),
    ...mapState(useFormStore, [
      'form',
      'formSubmission',
      'submissionUsers',
      'isRTL',
      'lang',
    ]),
    // State Machine
    showActionDate() {
      return ['ASSIGNED', 'COMPLETED'].includes(this.statusToSet);
    },
    showAssignee() {
      return ['ASSIGNED'].includes(this.statusToSet);
    },
    showCompleted() {
      return ['COMPLETED'].includes(this.statusToSet);
    },
    showRevising() {
      return ['REVISING'].includes(this.statusToSet);
    },
    statusRequired() {
      return [(v) => !!v || this.$t('trans.statusPanel.statusIsRequired')];
    },
    assigneeRequired() {
      return [(v) => !!v || this.$t('trans.statusPanel.assigneeIsRequired')];
    },
    maxChars() {
      return [(v) => v.length <= 4000 || this.$t('trans.statusPanel.maxChars')];
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
          actionStatus = i18n.t('trans.statusPanel.assign');
          break;
        case 'COMPLETE':
          actionStatus = i18n.t('trans.statusPanel.complete');
          break;
        case 'REVISE':
          actionStatus = i18n.t('trans.statusPanel.revise');
          break;
        case 'UPDATE':
          actionStatus = i18n.t('trans.statusPanel.update');
          break;
        default:
        // code block
      }
      return actionStatus;
    },
  },
  created() {
    this.getStatus();
  },
  methods: {
    ...mapActions(useFormStore, ['fetchSubmissionUsers']),
    ...mapActions(useNotificationStore, ['addNotification']),
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
            text: i18n.t('trans.statusPanel.fetchSubmissionUsersErr'),
            consoleError:
              i18n.t('trans.statusPanel.fetchSubmissionUsersConsErr') +
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

    autoCompleteFilter(_itemTitle, queryText, item) {
      return (
        item.value.fullName
          .toLocaleLowerCase()
          .includes(queryText.toLocaleLowerCase()) ||
        item.value.username
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
          throw new Error(i18n.t('trans.statusPanel.noStatusesFound'));
        } else {
          // Statuses are returned in date precedence, the 0th item in the array is the current status
          this.currentStatus = this.statusHistory[0];

          // Get the codes that this form is associated with
          const scRes = await formService.getStatusCodes(this.formId);
          const statusCodes = scRes.data;
          if (!statusCodes.length) {
            throw new Error(i18n.t('trans.statusPanel.statusCodesErr'));
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
          text: i18n.t('trans.statusPanel.notifyErrorCode'),
          consoleError:
            i18n.t('trans.statusPanel.notifyConsoleErrorCode') +
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
      this.$refs.statusPanelForm.resetValidation();
      this.submissionUserEmail = '';
      this.statusToSet = null;
      this.note = '';
    },

    async updateStatus() {
      try {
        if (this.$refs.statusPanelForm.validate()) {
          if (!this.statusToSet) {
            throw new Error(i18n.t('trans.statusPanel.status'));
          }

          const statusBody = {
            code: this.statusToSet,
            submissionUserEmail: this.submissionUserEmail,
            revisionNotificationEmailContent: this.emailComment,
          };
          if (this.showAssignee) {
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
              i18n.t('trans.statusPanel.updtSubmissionsStatusErr')
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
              throw new Error(i18n.t('trans.statusPanel.addNoteNoReponserErr'));
            }
            // Update the parent if the note was updated
            this.$emit('note-updated');
          }
          this.resetForm();
          this.getStatus();
        }
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.statusPanel.addNoteErrMsg'),
          consoleError: i18n.t('trans.statusPanel.addNoteConsoleErrMsg', {
            error: error,
          }),
        });
      }
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-skeleton-loader
      :loading="loading"
      type="list-item-two-line"
      class="bgtrans"
    >
      <div class="d-flex flex-column flex-1-1-100">
        <p :lang="lang">
          <strong>{{ $t('trans.statusPanel.currentStatus') }}</strong>
          {{ currentStatus.code }}
          <br />
          <strong>{{ $t('trans.statusPanel.assignedTo') }}</strong>
          {{ currentStatus.user ? currentStatus.user.fullName : 'N/A' }}
          <span v-if="currentStatus.user"
            >({{ currentStatus.user.email }})</span
          >
        </p>

        <v-form
          ref="statusPanelForm"
          v-model="valid"
          lazy-validation
          style="width: inherit"
        >
          <label :lang="lang">{{
            $t('trans.statusPanel.assignOrUpdateStatus')
          }}</label>
          <v-select
            v-model="statusToSet"
            variant="outlined"
            :items="items"
            item-title="display"
            item-value="code"
            style="width: 100% !important; padding: 0px !important"
            :rules="[(v) => !!v || $t('trans.statusPanel.statusIsRequired')]"
            @update:model-value="onStatusChange(statusToSet)"
          />

          <div v-show="statusFields">
            <div v-if="showAssignee">
              <label>
                Assign To
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-icon
                      color="primary"
                      v-bind="props"
                      icon="mdi:mdi-help-circle-outline"
                    ></v-icon>
                  </template>
                  <span
                    :lang="lang"
                    v-html="
                      $t('trans.statusPanel.assignSubmissnToFormReviewer')
                    "
                  >
                  </span>
                </v-tooltip>
              </label>
              <v-autocomplete
                v-model="assignee"
                :class="{ 'dir-rtl': isRTL }"
                autocomplete="autocomplete_off"
                clearable
                :custom-filter="autoCompleteFilter"
                :items="formReviewers"
                item-title="fullName"
                :loading="loading"
                :no-data-text="$t('trans.statusPanel.noDataText')"
                variant="outlined"
                return-object
                :rules="[
                  (v) => !!v || $t('trans.statusPanel.assigneeIsRequired'),
                ]"
                :lang="lang"
              >
                <!-- selected user -->
                <template #chip="{ props, item }">
                  <v-chip v-bind="props" :text="item?.raw?.fullName" />
                </template>
                <!-- users found in dropdown -->
                <template #item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :title="`${item?.raw?.fullName} (${item?.raw?.email})`"
                    :subtitle="`${item?.raw?.username} (${item?.raw?.idpCode})`"
                  >
                  </v-list-item>
                </template>
              </v-autocomplete>
              <span v-if="assignee">Email: {{ assignee.email }}</span>

              <div class="text-right">
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  class="pl-0 my-0 text-end"
                  @click="assignToCurrentUser"
                >
                  <v-icon class="mr-1" icon="mdi:mdi-account"></v-icon>
                  <span :lang="lang">{{
                    $t('trans.statusPanel.assignToMe')
                  }}</span>
                </v-btn>
              </div>
            </div>
            <div v-show="statusFields" v-if="showRevising">
              <v-text-field
                v-model="submissionUserEmail"
                :label="$t('trans.statusPanel.recipientEmail')"
                variant="outlined"
                density="compact"
                :class="{ 'dir-rtl': isRTL }"
                :lang="lang"
              />
            </div>

            <div v-if="showRevising || showAssignee || showCompleted">
              <v-checkbox
                v-model="addComment"
                :label="$t('trans.statusPanel.attachCommentToEmail')"
                :lang="lang"
              />
              <div v-if="addComment">
                <label :lang="lang">{{
                  $t('trans.statusPanel.emailComment')
                }}</label>
                <v-textarea
                  v-model="emailComment"
                  :class="{ 'dir-rtl': isRTL }"
                  :rules="[
                    (v) => v.length <= 4000 || $t('trans.statusPanel.maxChars'),
                  ]"
                  rows="1"
                  counter
                  auto-grow
                  density="compact"
                  variant="outlined"
                  solid
                />
              </div>
            </div>
          </div>

          <v-row class="mt-3">
            <v-col cols="12" sm="6" xl="4">
              <v-dialog v-model="historyDialog" width="1200">
                <template #activator="{ props }">
                  <v-btn
                    id="btnText"
                    block
                    variant="outlined"
                    color="textLink"
                    v-bind="props"
                  >
                    <span :lang="lang">{{
                      $t('trans.statusPanel.viewHistory')
                    }}</span>
                  </v-btn>
                </template>

                <v-card v-if="historyDialog">
                  <v-card-title
                    class="text-h5 pb-0"
                    :class="{ 'dir-rtl': isRTL }"
                    :lang="lang"
                    >{{ $t('trans.statusPanel.statusHistory') }}</v-card-title
                  >

                  <v-card-text>
                    <hr />
                    <StatusTable :submission-id="submissionId" />
                  </v-card-text>

                  <v-card-actions class="justify-center">
                    <v-btn
                      class="mb-5 close-dlg"
                      :class="{ 'dir-rtl': isRTL }"
                      color="primary"
                      variant="flat"
                      @click="historyDialog = false"
                    >
                      <span :lang="lang">{{
                        $t('trans.statusPanel.close')
                      }}</span>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>

            <v-col cols="12" sm="6" xl="4" order="first" order-sm="last">
              <v-btn
                block
                :disabled="!statusToSet"
                color="primary"
                @click="updateStatus"
              >
                <span>{{ statusAction }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </div>
    </v-skeleton-loader>
  </div>
</template>

<style>
.v-btn__content {
  width: 100%;
  white-space: normal;
}
</style>
