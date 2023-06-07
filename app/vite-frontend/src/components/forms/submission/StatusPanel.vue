<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusTable from '~/components/forms/submission/StatusTable.vue';
import { formService, rbacService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions } from '~/utils/constants';

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

const emits = defineEmits(['draft-enabled', 'note-updated']);

const { t } = useI18n({ useScope: 'global' });

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
const statusHistory = ref({});
const statusFields = ref(false);
const statusPanelForm = ref(null);
const statusToSet = ref('');
const valid = ref(false);
const showSendConfirmEmail = ref(false);

const authStore = useAuthStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { identityProviderIdentity } = storeToRefs(authStore);
const { form, formSubmission, submissionUsers } = storeToRefs(formStore);

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

async function onStatusChange(status) {
  statusFields.value = true;
  addComment.value = false;
  if (status === 'REVISING' || status === 'COMPLETED') {
    try {
      await formStore.fetchSubmissionUsers(properties.submissionId);

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
        showSendConfirmEmail.value = status === 'COMPLETED';
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
    (f) => f.idpUserId === identityProviderIdentity.value
  );
}

function autoCompleteFilter(item, queryText) {
  return (
    item.fullName.toLocaleLowerCase().includes(queryText.toLocaleLowerCase()) ||
    item.username.toLocaleLowerCase().includes(queryText.toLocaleLowerCase())
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

    emits('draft-enabled', statuses.data[0].code);

    statusHistory.value = statuses.data;
    if (!statusHistory.value.length || !statusHistory.value[0]) {
      throw new Error(t('trans.statusPanel.noStatusesFound'));
    } else {
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
  statusToSet.value = null;
  note.value = '';
}

async function updateStatus() {
  try {
    if (statusPanelForm.value.validate()) {
      if (!statusToSet.value) {
        throw new Error(t('trans.statusPanel.status'));
      }

      const statusBody = {
        code: statusToSet.value,
        submissionUserEmail: submissionUserEmail.value,
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

      if (emailComment.value) {
        let formattedComment;
        if (statusToSet.value === 'ASSIGNED') {
          formattedComment = `Email to ${assignee.value.email}: ${emailComment.value}`;
        } else if (
          statusToSet.value === 'REVISING' ||
          statusToSet.value === 'COMPLETED'
        ) {
          formattedComment = `Email to ${submissionUserEmail.value}: ${emailComment.value}`;
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
        emits('note-updated');
      }
      resetForm();
      getStatus();
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

getStatus();
</script>

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

      <v-form ref="statusPanelForm" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12">
            <label>{{ $t('trans.statusPanel.assignOrUpdateStatus') }}</label>
            <v-select
              v-model="statusToSet"
              variant="outlined"
              :items="items"
              item-title="display"
              item-value="code"
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
                      v-html="
                        $t('trans.statusPanel.assignSubmissnToFormReviewer')
                      "
                    >
                    </span>
                  </v-tooltip>
                </label>
                <v-autocomplete
                  v-model="assignee"
                  autocomplete="autocomplete_off"
                  clearable
                  :custom-filter="autoCompleteFilter"
                  :items="formReviewers"
                  :loading="loading"
                  :no-data-text="$t('trans.statusPanel.noDataText')"
                  variant="outlined"
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
                    <span>{{ $t('trans.statusPanel.assignToMe') }}</span>
                  </v-btn>
                </div>
              </div>
              <div v-show="statusFields" v-if="showRevising">
                <v-text-field
                  v-model="submissionUserEmail"
                  :label="$t('trans.statusPanel.recipientEmail')"
                  variant="outlined"
                  density="compact"
                />
              </div>

              <div v-if="showRevising || showAssignee || showCompleted">
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
                    density="compact"
                    variant="outlined"
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
              <template #activator="{ props }">
                <v-btn
                  id="btnText"
                  block
                  variant="outlined"
                  color="textLink"
                  v-bind="props"
                >
                  <span>{{ $t('trans.statusPanel.viewHistory') }}</span>
                </v-btn>
              </template>

              <v-card v-if="historyDialog">
                <v-card-title class="text-h5 pb-0">{{
                  $t('trans.statusPanel.statusHistory')
                }}</v-card-title>

                <v-card-text>
                  <hr />
                  <StatusTable :submission-id="submissionId" />
                </v-card-text>

                <v-card-actions class="justify-center">
                  <v-btn
                    class="mb-5 close-dlg"
                    color="primary"
                    @click="historyDialog = false"
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
              :disabled="!statusToSet"
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

<style>
.v-btn__content {
  width: 100%;
  white-space: normal;
}
</style>
