<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { rbacService, userService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useIdpStore } from '~/store/identityProviders';
import { FormPermissions, NotificationTypes, Regex } from '~/utils/constants';
import { filterObject } from '~/utils/transformUtils';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  isDraft: {
    type: Boolean,
    required: true,
  },
  submissionId: {
    type: String,
    required: true,
  },
});

const dialog = ref(false);
const formSubmissionUsers = ref([]); // the users added to the team for this submission
const isLoadingDropdown = ref(false);
const isLoadingTable = ref(true);
const selectedIdp = ref(null);
const showDeleteDialog = ref(false);
const userSearchInput = ref(null); // the search filter
const userSearchResults = ref([]);
const userSearchSelection = ref(null); // the selected user
const userToDelete = ref({});

const formStore = useFormStore();
const idpStore = useIdpStore();
const notificationStore = useNotificationStore();

const { isRTL } = storeToRefs(formStore);

const autocompleteLabel = computed(() => {
  return idpStore.isPrimary(selectedIdp.value)
    ? t('trans.manageSubmissionUsers.requiredField')
    : t('trans.manageSubmissionUsers.exactEmailOrUsername');
});

watch(selectedIdp, (newIdp, oldIdp) => {
  onChangeSelectedIdp(newIdp, oldIdp);
});

watch(userSearchInput, async (input) => {
  await onChangeUserSearchInput(input);
});

initializeSelectedIdp();
getSubmissionUsers();

function onChangeSelectedIdp(newIdp, oldIdp) {
  if (newIdp !== oldIdp) {
    userSearchResults.value = [];
  }
}

async function onChangeUserSearchInput(input) {
  if (!input) return;
  isLoadingDropdown.value = true;
  try {
    // The form's IDP (only support 1 at a time right now), blank is 'team' and should be Primary
    let params = {};
    params.idpCode = selectedIdp.value;
    let teamMembershipConfig = idpStore.teamMembershipSearch(selectedIdp.value);
    if (teamMembershipConfig) {
      if (input.length < teamMembershipConfig.text.minLength)
        throw new Error(t(teamMembershipConfig.text.message));
      if (input.includes('@')) {
        if (!new RegExp(Regex.EMAIL).test(input))
          throw new Error(t(teamMembershipConfig.email.message));
        else params.email = input;
      } else {
        params.username = input;
      }
    } else {
      params.search = input;
    }
    const response = await userService.getUsers(params);
    userSearchResults.value = response.data;
  } catch (error) {
    // userSearchResults.value = [];
    /* eslint-disable no-console */
    console.error(
      t('trans.manageSubmissionUsers.getUsersErrMsg', {
        error: error,
      })
    ); // eslint-disable-line no-console
  } finally {
    isLoadingDropdown.value = false;
  }
}

// workaround so we can use computed value (primaryIdp) in created()
function initializeSelectedIdp() {
  selectedIdp.value = idpStore.primaryIdp?.code;
}

// show users in dropdown that have a text match on multiple properties
async function addUser() {
  // If the end user selected a user
  if (userSearchSelection.value) {
    const id = userSearchSelection.value.id;
    // If a selected user is already on the team
    if (formSubmissionUsers.value.some((u) => u.id === id)) {
      notificationStore.addNotification({
        ...NotificationTypes.WARNING,
        text: t('trans.manageSubmissionUsers.remove', {
          username: userSearchSelection.value.username,
        }),
      });
    }
    // Add a new user to the team
    else {
      await modifyPermissions(id, [
        FormPermissions.SUBMISSION_UPDATE,
        FormPermissions.SUBMISSION_READ,
      ]);
    }
  }
  // reset search field
  userSearchSelection.value = null;
}

async function getSubmissionUsers() {
  isLoadingTable.value = true;
  try {
    const response = await rbacService.getSubmissionUsers({
      formSubmissionId: properties.submissionId,
    });
    if (response.data) {
      formSubmissionUsers.value = transformResponseToTable(response.data);
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.manageSubmissionUsers.getSubmissionUsersErr'),
      consoleError: t(
        'trans.manageSubmissionUsers.getSubmissionUsersConsoleErr',
        { submissionId: properties.submissionId, error: error }
      ),
    });
  } finally {
    isLoadingTable.value = false;
  }
}

async function modifyPermissions(userId, permissions) {
  isLoadingTable.value = true;
  try {
    const selectedEmail = permissions.length
      ? userSearchSelection.value.email
      : userToDelete.value.email;
    // Add the selected user with read/update permissions on this submission
    const response = await rbacService.setSubmissionUserPermissions(
      { permissions: permissions },
      {
        formSubmissionId: properties.submissionId,
        userId: userId,
        selectedUserEmail: selectedEmail,
      }
    );
    if (response.data) {
      formSubmissionUsers.value = transformResponseToTable(response.data);
      notificationStore.addNotification({
        ...NotificationTypes.SUCCESS,
        text: permissions.length
          ? t('trans.manageSubmissionUsers.sentInviteEmailTo') +
            ' ' +
            `${selectedEmail}`
          : t('trans.manageSubmissionUsers.sentUninvitedEmailTo') +
            ' ' +
            `${selectedEmail}`,
      });
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.manageSubmissionUsers.updateUserErrMsg'),
      consoleError: t('trans.manageSubmissionUsers.updateUserErrMsg', {
        submissionId: properties.submissionId,
        userId: userId,
        error: error,
      }),
    });
  } finally {
    isLoadingTable.value = false;
  }
}

function removeUser(userRow) {
  userToDelete.value = userRow;
  showDeleteDialog.value = true;
}

function transformResponseToTable(responseData) {
  return responseData
    .map((su) => {
      return {
        email: su.user.email,
        fullName: su.user.fullName,
        id: su.userId,
        isOwner: su.permissions.includes(FormPermissions.SUBMISSION_CREATE),
        username: su.user.username,
      };
    })
    .sort((a, b) => b.isOwner - a.isOwner);
}

defineExpose({
  addUser,
  autocompleteLabel,
  formSubmissionUsers,
  modifyPermissions,
  onChangeSelectedIdp,
  onChangeUserSearchInput,
  removeUser,
  selectedIdp,
  showDeleteDialog,
  userSearchResults,
  userSearchSelection,
  userToDelete,
});
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          color="primary"
          icon
          v-bind="props"
          size="x-small"
          :title="$t('trans.manageSubmissionUsers.manageTeamMembers')"
          @click="dialog = true"
        >
          <v-icon icon="mdi:mdi-account-multiple"></v-icon>
        </v-btn>
      </template>
      <span :lang="locale">{{
        $t('trans.manageSubmissionUsers.manageTeamMembers')
      }}</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card :class="{ 'dir-rtl': isRTL }">
        <v-card-title class="text-h5 pb-0" :lang="locale">
          {{ $t('trans.manageSubmissionUsers.manageTeamMembers') }}
        </v-card-title>
        <v-card-subtitle>
          <v-radio-group v-if="isDraft" v-model="selectedIdp" inline>
            <v-radio
              v-for="button in idpStore.loginButtons"
              :key="button.code"
              :value="button.code"
              :label="button.display"
            />
          </v-radio-group>
        </v-card-subtitle>
        <v-card-text>
          <hr class="mt-1" />
          <v-row v-if="isDraft">
            <v-col cols="9">
              <form autocomplete="off">
                <v-autocomplete
                  v-model="userSearchSelection"
                  v-model:search="userSearchInput"
                  :class="{ label: isRTL }"
                  autocomplete="autocomplete_off"
                  :items="userSearchResults"
                  chips
                  closable-chips
                  clearable
                  item-title="fullName"
                  density="compact"
                  :custom-filter="filterObject"
                  hide-details
                  :label="autocompleteLabel"
                  :loading="isLoadingDropdown"
                  return-object
                >
                  <!-- no data -->
                  <template #no-data>
                    <div
                      class="px-2"
                      :lang="locale"
                      v-html="
                        $t('trans.manageSubmissionUsers.userNotFoundErrMsg')
                      "
                    />
                  </template>
                  <template #chip="{ props, item }">
                    <v-chip v-bind="props" :text="item?.raw?.fullName"></v-chip>
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
              </form>
            </v-col>
            <v-col cols="3">
              <v-btn
                color="primary"
                :disabled="!userSearchSelection"
                :loading="isLoadingDropdown"
                :title="$t('trans.manageSubmissionUsers.add')"
                @click="addUser"
              >
                <span :lang="locale"
                  >{{ $t('trans.manageSubmissionUsers.add') }}
                </span>
              </v-btn>
            </v-col>
          </v-row>
          <div v-else :lang="locale">
            {{ $t('trans.manageSubmissionUsers.draftFormInvite') }}
          </div>

          <p class="mt-5" :lang="locale">
            <strong
              >{{
                $t('trans.manageSubmissionUsers.submissionTeamMembers')
              }}:</strong
            >
          </p>

          <v-skeleton-loader
            :loading="isLoadingTable"
            type="table-row"
            class="bgtrans"
          >
            <v-table dense>
              <thead>
                <tr>
                  <th
                    :class="isRTL ? 'text-right' : 'text-left'"
                    :lang="locale"
                  >
                    {{ $t('trans.manageSubmissionUsers.name') }}
                  </th>
                  <th
                    :class="isRTL ? 'text-right' : 'text-left'"
                    :lang="locale"
                  >
                    {{ $t('trans.manageSubmissionUsers.username') }}
                  </th>
                  <th
                    :class="isRTL ? 'text-right' : 'text-left'"
                    :lang="locale"
                  >
                    {{ $t('trans.manageSubmissionUsers.email') }}
                  </th>
                  <th
                    v-if="isDraft"
                    :class="isRTL ? 'text-right' : 'text-left'"
                    :lang="locale"
                  >
                    {{ $t('trans.manageSubmissionUsers.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in formSubmissionUsers" :key="item.userId">
                  <td>{{ item.fullName }}</td>
                  <td>{{ item.username }}</td>
                  <td>{{ item.email }}</td>
                  <td v-if="isDraft">
                    <v-btn
                      color="red"
                      icon
                      size="24"
                      :disabled="item.isOwner"
                      :title="$t('trans.manageSubmissionUsers.remove')"
                      @click="removeUser(item)"
                    >
                      <v-icon icon="mdi:mdi-minus" size="16"></v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-skeleton-loader>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn
            class="mb-5 close-dlg"
            color="primary"
            variant="flat"
            :title="$t('trans.manageSubmissionUsers.close')"
            @click="dialog = false"
          >
            <span :lang="locale">
              {{ $t('trans.manageSubmissionUsers.close') }}</span
            >
          </v-btn>
        </v-card-actions>
      </v-card>

      <BaseDialog
        v-model="showDeleteDialog"
        :class="{ 'dir-rtl': isRTL }"
        type="CONTINUE"
        @close-dialog="showDeleteDialog = false"
        @continue-dialog="
          modifyPermissions(userToDelete.id, []);
          showDeleteDialog = false;
        "
      >
        <template #title
          ><span>Remove {{ userToDelete.username }}</span></template
        >
        <template #text>
          <span :lang="locale">
            {{ $t('trans.manageSubmissionUsers.removeUserWarningMsg1') }}
            <strong>{{ userToDelete.username }}</strong
            >? {{ $t('trans.manageSubmissionUsers.removeUserWarningMsg2') }}
          </span>
        </template>
        <template #button-text-continue>
          <span :lang="locale">{{
            $t('trans.manageSubmissionUsers.remove')
          }}</span>
        </template>
      </BaseDialog>
    </v-dialog>
  </span>
</template>
