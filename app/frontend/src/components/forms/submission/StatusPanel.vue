<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusTable from '~/components/forms/submission/StatusTable.vue';
import { formService, rbacService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
  submissionId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['draft-enabled', 'note-updated']);

const assignee = ref(null);
const addComment = ref(false);
const currentStatus = ref({});
const formReviewers = ref([]);
const historyDialog = ref(false);
const items = ref([]);
const loading = ref(true);
const note = ref('');
const emailComment = ref('');
const submissionUserEmail = ref('');
const formSubmitters = ref([]);
const selectAllSubmitters = ref(false);
const selectedSubmissionUsers = ref([]);
const statusHistory = ref({});
const statusFields = ref(false);
const statusPanelForm = ref(null);
const statusToSet = ref('');
const valid = ref(false);
const showSendConfirmEmail = ref(false);
const showStatusContent = ref(false);
const emailRecipients = ref([]);

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { user } = storeToRefs(useAuthStore());
const { form, formSubmission, submissionUsers, isRTL } = storeToRefs(formStore);

// State Machine
const showAssignee = computed(() => ['ASSIGNED'].includes(statusToSet.value));

const showCompleted = computed(() => ['COMPLETED'].includes(statusToSet.value));

const showRevising = computed(() => ['REVISING'].includes(statusToSet.value));

const statusAction = computed(() => {
  const obj = Object.freeze({
    ASSIGNED: 'ASSIGN',
    COMPLETED: 'COMPLETE',
    REVISING: 'REVISE',
    DEFAULT: 'UPDATE',
  });

  let action = obj[statusToSet.value] ? obj[statusToSet.value] : obj['DEFAULT'];

  let actionStatus = '';
  switch (action) {
    case 'ASSIGN':
      actionStatus = t('trans.statusPanel.assign');
      break;
    case 'COMPLETE':
      actionStatus = t('trans.statusPanel.complete');
      break;
    case 'REVISE':
      actionStatus = t('trans.statusPanel.revise');
      break;
    case 'UPDATE':
      actionStatus = t('trans.statusPanel.update');
      break;
    default:
    // code block
  }
  return actionStatus;
});

async function getEmailRecipients() {
  try {
    const response = await formService.getEmailRecipients(
      properties.submissionId
    );
    if (response.data) {
      emailRecipients.value = response.data.emailRecipients;
    } else {
      emailRecipients.value = [submissionUserEmail.value];
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.statusPanel.fetchSubmissionUsersErr'),
      consoleError: t('trans.statusPanel.fetchSubmissionUsersErr', {
        error: error.message,
      }),
    });
  }
}

watch(selectAllSubmitters, (newValue) => {
  if (newValue) {
    selectedSubmissionUsers.value = formSubmitters.value.map(
      (user) => user.value
    );
  } else {
    // selectAllSubmitters is false, disable the checkbox if the array contains all the submitters
    if (selectedSubmissionUsers.value.length === formSubmitters.value.length) {
      selectAllSubmitters.value = true;
    }
  }
});

watch(selectedSubmissionUsers, (newValue) => {
  if (newValue.length !== formSubmitters.value.length) {
    selectAllSubmitters.value = false;
  }
});

getStatus();

async function onStatusChange(status) {
  statusFields.value = true;
  addComment.value = false;
  if (status === 'REVISING' || status === 'COMPLETED') {
    try {
      await formStore.fetchSubmissionUsers(properties.submissionId);

      // add all the submission users emails to the formSubmitters array
      formSubmitters.value = submissionUsers.value.data.map((data) => {
        const username = data.user.idpCode
          ? `${data.user.username} (${data.user.idpCode})`
          : data.user.username;
        return {
          value: data.user.email,
          title: `${data.user.fullName} (${data.user.email})`,
          subtitle: `${username}`,
        };
      });

      const submitterData = submissionUsers.value.data.find((data) => {
        const username = data.user.idpCode
          ? `${data.user.username}@${data.user.idpCode}`
          : data.user.username;
        return username === formSubmission.value.createdBy;
      });

      if (submitterData) {
        submissionUserEmail.value = submitterData.user
          ? submitterData.user.email
          : undefined;

        // add the submissionUserEmail to the selectedSubmissionUsers array
        selectedSubmissionUsers.value = [submissionUserEmail.value];

        if (status === 'COMPLETED') {
          showSendConfirmEmail.value = true;
          await getEmailRecipients();
        }
      }
    } catch (error) {
      notificationStore.addNotification({
        text: t('trans.statusPanel.fetchSubmissionUsersErr'),
        consoleError:
          t('trans.statusPanel.fetchSubmissionUsersConsErr') +
          `${properties.submissionId}: ${error}`,
      });
    }
  }
}

function assignToCurrentUser() {
  assignee.value = formReviewers.value.find(
    (f) => f.idpUserId === user.value.idpUserId
  );
}

function autoCompleteFilter(_itemTitle, queryText, item) {
  return (
    item.value.fullName
      .toLocaleLowerCase()
      .includes(queryText.toLocaleLowerCase()) ||
    item.value.username
      .toLocaleLowerCase()
      .includes(queryText.toLocaleLowerCase())
  );
}

function revisingFilter(_itemTitle, queryText, item) {
  return (
    item.value.toLocaleLowerCase().includes(queryText.toLocaleLowerCase()) ||
    item.title.toLocaleLowerCase().includes(queryText.toLocaleLowerCase())
  );
}

async function getStatus() {
  loading.value = true;
  try {
    // Prepopulate the form reviewers (people with submission read on this form)
    const rbacUsrs = await rbacService.getFormUsers({
      formId: properties.formId,
      permissions: FormPermissions.SUBMISSION_READ,
    });
    formReviewers.value = rbacUsrs.data.sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );

    // Get submission status
    const statuses = await formService.getSubmissionStatuses(
      properties.submissionId
    );

    statusHistory.value = statuses.data;
    if (!statusHistory.value.length || !statusHistory.value[0]) {
      throw new Error(t('trans.statusPanel.noStatusesFound'));
    } else {
      emit('draft-enabled', statuses.data[0].code);
      // Statuses are returned in date precedence, the 0th item in the array is the current status
      currentStatus.value = statusHistory.value[0];

      // Get the codes that this form is associated with
      const scRes = await formService.getStatusCodes(properties.formId);
      const statusCodes = scRes.data;
      if (!statusCodes.length) {
        throw new Error(t('trans.statusPanel.statusCodesErr'));
      }
      // For the CURRENT status, add the code details (display name, next codes etc)
      currentStatus.value.statusCodeDetail = statusCodes.find(
        (sc) => sc.code === currentStatus.value.code
      ).statusCode;
      items.value = currentStatus.value.statusCodeDetail.nextCodes;
    }
    if (!form.value.enableSubmitterDraft) {
      items.value = items.value.filter((item) => item !== 'REVISING');
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.statusPanel.notifyErrorCode'),
      consoleError:
        t('trans.statusPanel.notifyConsoleErrorCode') + `${error.message}`,
    });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  addComment.value = false;
  emailComment.value = '';
  statusFields.value = false;
  statusPanelForm.value.resetValidation();
  submissionUserEmail.value = '';
  selectAllSubmitters.value = false;
  formReviewers.value = [];
  selectedSubmissionUsers.value = [];
  statusToSet.value = '';
  note.value = '';
  emailRecipients.value = [];
}

async function updateStatus() {
  try {
    if (statusPanelForm.value.validate()) {
      if (!statusToSet.value) {
        throw new Error(t('trans.statusPanel.status'));
      }

      const statusBody = {
        code: statusToSet.value,
        submissionUserEmails:
          statusToSet.value === 'COMPLETED'
            ? emailRecipients.value
            : selectedSubmissionUsers.value,
        revisionNotificationEmailContent: emailComment.value,
      };
      if (showAssignee.value) {
        if (assignee.value) {
          statusBody.assignedToUserId = assignee.value.userId;
          statusBody.assignmentNotificationEmail = assignee.value.email;
        }
      }

      const statusResponse = await formService.updateSubmissionStatus(
        properties.submissionId,
        statusBody
      );
      if (!statusResponse.data) {
        throw new Error(t('trans.statusPanel.updtSubmissionsStatusErr'));
      }

      if (statusToSet.value === 'REVISING') {
        await formService.addEmailRecipients(properties.submissionId, {
          emailRecipients: selectedSubmissionUsers.value,
        });
      }

      if (emailComment.value) {
        let formattedComment;
        if (statusToSet.value === 'ASSIGNED') {
          formattedComment = `Email to ${assignee.value.email}: ${emailComment.value}`;
        } else if (statusToSet.value === 'REVISING') {
          const emailList = selectedSubmissionUsers.value.join(', ');
          formattedComment = `Email to ${emailList}: ${emailComment.value}`;
        } else if (statusToSet.value === 'COMPLETED') {
          const emailList = emailRecipients.value.join(', ');
          formattedComment = `Email to ${emailList}: ${emailComment.value}`;
        }

        const submissionStatusId = statusResponse.data[0].submissionStatusId;
        const user = await rbacService.getCurrentUser();
        const noteBody = {
          submissionId: properties.submissionId,
          submissionStatusId: submissionStatusId,
          note: formattedComment,
          userId: user.data.id,
        };
        const response = await formService.addNote(
          properties.submissionId,
          noteBody
        );
        if (!response.data) {
          throw new Error(t('trans.statusPanel.addNoteNoReponserErr'));
        }
        // Update the parent if the note was updated
        emit('note-updated');
      }

      resetForm();
      await getStatus();
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.statusPanel.addNoteErrMsg'),
      consoleError: t('trans.statusPanel.addNoteConsoleErrMsg', {
        error: error,
      }),
    });
  }
}

defineExpose({
  addComment,
  assignee,
  autoCompleteFilter,
  revisingFilter,
  emailComment,
  formReviewers,
  getStatus,
  note,
  onStatusChange,
  resetForm,
  showSendConfirmEmail,
  statusAction,
  statusHistory,
  statusFields,
  statusToSet,
  submissionUserEmail,
  formSubmitters,
  selectAllSubmitters,
  updateStatus,
  getEmailRecipients,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="flex-container"
      data-test="showStatusPanel"
      @click="showStatusContent = !showStatusContent"
    >
      <h2 class="status-heading" :class="{ 'dir-rtl': isRTL }" :lang="locale">
        {{ $t('trans.formSubmission.status') }}
        <v-icon>{{
          showStatusContent
            ? 'mdi:mdi-chevron-down'
            : isRTL
            ? 'mdi:mdi-chevron-left'
            : 'mdi:mdi-chevron-right'
        }}</v-icon>
      </h2>
      <!-- Show <p> here for screens greater than 959px  -->
      <p class="hide-on-narrow" :lang="locale">
        <span :class="isRTL ? 'status-details-rtl' : 'status-details'">
          <strong>{{ $t('trans.statusPanel.currentStatus') }}</strong>
          {{ currentStatus.code }}
        </span>
        <span :class="isRTL ? 'status-details-rtl' : 'status-details'">
          <strong>{{ $t('trans.statusPanel.assignedTo') }}</strong>
          {{ currentStatus.user ? currentStatus.user.fullName : 'N/A' }}
          <span v-if="currentStatus.user" data-test="showAssigneeEmail">
            ({{ currentStatus.user.email }})
          </span>
        </span>
      </p>
    </div>
    <v-skeleton-loader
      :loading="loading"
      type="list-item-two-line"
      class="bgtrans"
    >
      <div v-if="showStatusContent" class="d-flex flex-column flex-1-1-100">
        <!-- Show <p> here for screens less than 960px  -->
        <p class="hide-on-wide" :lang="locale">
          <strong>{{ $t('trans.statusPanel.currentStatus') }}</strong>
          {{ currentStatus.code }}
          <br />
          <strong>{{ $t('trans.statusPanel.assignedTo') }}</strong>
          {{ currentStatus.user ? currentStatus.user.fullName : 'N/A' }}
          <span v-if="currentStatus.user" data-test="showAssigneeEmail"
            >({{ currentStatus.user.email }})</span
          >
        </p>
        <v-form
          ref="statusPanelForm"
          v-model="valid"
          lazy-validation
          style="width: inherit"
        >
          <label :lang="locale">{{
            $t('trans.statusPanel.assignOrUpdateStatus')
          }}</label>
          <v-select
            v-model="statusToSet"
            variant="outlined"
            :items="items"
            item-title="display"
            data-test="showStatusList"
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
                    :lang="locale"
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
                data-test="showAssigneeList"
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
                :lang="locale"
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
                    :subtitle="`${item?.raw?.username} (${item?.raw?.user_idpCode})`"
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
                  data-test="canAssignToMe"
                  :title="$t('trans.statusPanel.assignToMe')"
                  @click="assignToCurrentUser"
                >
                  <v-icon class="mr-1" icon="mdi:mdi-account"></v-icon>
                  <span :lang="locale">{{
                    $t('trans.statusPanel.assignToMe')
                  }}</span>
                </v-btn>
              </div>
            </div>
            <div v-show="statusFields" v-if="showRevising">
              <span :lang="locale">{{
                $t('trans.statusPanel.recipientEmail')
              }}</span>
              <v-autocomplete
                v-model="selectedSubmissionUsers"
                :class="{ 'dir-rtl': isRTL }"
                autocomplete="autocomplete_off"
                data-test="showRecipientEmail"
                clearable
                multiple
                :custom-filter="revisingFilter"
                :items="formSubmitters"
                item-value="value"
                item-title="display"
                :loading="loading"
                :no-data-text="$t('trans.statusPanel.noDataText')"
                variant="outlined"
                :rules="[
                  (v) =>
                    !!v.length || $t('trans.statusPanel.recipientIsRequired'),
                ]"
                :lang="locale"
              >
                <!-- selected user -->
                <template #chip="{ props, item }">
                  <v-chip v-bind="props" :text="item?.raw?.value" />
                </template>
                <!-- users found in dropdown -->
                <template #item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :title="`${item?.raw?.title}`"
                    :subtitle="`${item?.raw?.subtitle}`"
                  >
                  </v-list-item>
                </template>
              </v-autocomplete>
              <v-checkbox
                v-model="selectAllSubmitters"
                label="Notify all submitters"
              />
            </div>

            <div v-if="showRevising || showAssignee || showCompleted">
              <v-checkbox
                v-model="addComment"
                :label="$t('trans.statusPanel.attachCommentToEmail')"
                :lang="locale"
                data-test="canAttachCommentToEmail"
              />
              <div v-if="addComment">
                <label :lang="locale">{{
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
                  data-test="canAddComment"
                  solid
                />
              </div>
            </div>
          </div>

          <v-row class="mt-3">
            <v-col>
              <v-dialog v-model="historyDialog" width="1200">
                <template #activator="{ props }">
                  <v-btn
                    id="btnText"
                    class="wide-button"
                    variant="outlined"
                    color="textLink"
                    v-bind="props"
                    :title="$t('trans.statusPanel.viewHistory')"
                    data-test="viewHistoryButton"
                  >
                    <span :lang="locale">{{
                      $t('trans.statusPanel.viewHistory')
                    }}</span>
                  </v-btn>
                  <v-btn
                    class="wide-button"
                    :disabled="!statusToSet"
                    color="primary"
                    :title="statusAction"
                    data-test="updateStatusToNew"
                    @click="updateStatus"
                  >
                    <span>{{ statusAction }}</span>
                  </v-btn>
                </template>

                <v-card v-if="historyDialog">
                  <v-card-title
                    class="text-h5 pb-0"
                    :class="{ 'dir-rtl': isRTL }"
                    :lang="locale"
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
                      :title="$t('trans.statusPanel.close')"
                      data-test="canCloseStatusPanel"
                      @click="historyDialog = false"
                    >
                      <span :lang="locale">{{
                        $t('trans.statusPanel.close')
                      }}</span>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
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

.status-heading {
  color: #003366;
  margin-bottom: 0;
  .v-icon {
    transition: transform 0.3s ease;
  }
}

.hide-on-narrow {
  margin: 0;
}

@media (max-width: 1279px) {
  .hide-on-narrow {
    display: none;
  }
}
@media (min-width: 1280px) {
  .hide-on-wide {
    display: none;
  }
}

.wide-button {
  width: 200px;
  margin-right: 10px;
  margin-bottom: 10px;
}

.wide-button:last-child {
  margin-right: 0;
}

/* Uncomment this to widen buttons for small screens */
/* @media (max-width: 599px) {
  .wide-button {
    width: 100%;
  }
} */

.flex-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.status-details-rtl {
  margin-right: 15px;
}

.status-details {
  margin-left: 15px;
}
</style>
