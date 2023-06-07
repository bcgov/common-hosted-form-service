<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { rbacService, userService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  IdentityProviders,
  NotificationTypes,
  Regex,
} from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

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
const isLoadingTable = ref(true);
const showDeleteDialog = ref(false);
const userTableList = ref([]);
const userToDelete = ref({});

const findUsers = ref(null);
const isLoadingDropdown = ref(false);
const selectedIdp = ref(IdentityProviders.IDIR);
const userSearchResults = ref([]);
const userSearchSelection = ref(null);

const notificationStore = useNotificationStore();

const ID_PROVIDERS = computed(() => IdentityProviders);
const autocompleteLabel = computed(() =>
  selectedIdp.value == IdentityProviders.IDIR
    ? t('trans.manageSubmissionUsers.requiredFiled')
    : t('trans.manageSubmissionUsers.exactEmailOrUsername')
);

// show users in dropdown that have a text match on multiple properties
function addUser() {
  if (userSearchSelection.value) {
    const id = userSearchSelection.value.id;
    if (userTableList.value.some((u) => u.id === id)) {
      notificationStore.addNotification({
        ...NotificationTypes.WARNING,
        text: t('trans.manageSubmissionUsers.remove', {
          username: userSearchSelection.value.username,
        }),
      });
    } else {
      modifyPermissions(id, [
        FormPermissions.SUBMISSION_UPDATE,
        FormPermissions.SUBMISSION_READ,
      ]);
    }
  }
  // reset search field
  userSearchSelection.value = null;
}

function filterObject(item, queryText) {
  return Object.values(item)
    .filter((v) => v)
    .some((v) => v.toLocaleLowerCase().includes(queryText.toLocaleLowerCase()));
}

async function getSubmissionUsers() {
  isLoadingTable.value = true;
  try {
    const response = await rbacService.getSubmissionUsers({
      formSubmissionId: properties.submissionId,
    });
    if (response.data) {
      userTableList.value = transformResponseToTable(response.data);
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
      userTableList.value = transformResponseToTable(response.data);
      notificationStore.addNotification({
        ...NotificationTypes.SUCCESS,
        text: permissions.length
          ? t('trans.manageSubmissionUsers.sentInviteEmailTo') +
            `${selectedEmail}`
          : t('trans.manageSubmissionUsers.sentUninvitedEmailTo') +
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

watch(selectedIdp, (newIdp, oldIdp) => {
  if (newIdp !== oldIdp) {
    userSearchResults.value = [];
  }
});

watch(findUsers, async (input) => {
  if (!input) return;
  isLoadingDropdown.value = true;
  try {
    // The form's IDP (only support 1 at a time right now), blank is 'team' and should be IDIR
    let params = {};
    params.idpCode = selectedIdp.value;
    if (
      selectedIdp.value == IdentityProviders.BCEIDBASIC ||
      selectedIdp.value == IdentityProviders.BCEIDBUSINESS
    ) {
      if (input.length < 6)
        throw new Error(t('trans.manageSubmissionUsers.searchInputLength'));
      if (input.includes('@')) {
        if (!new RegExp(Regex.EMAIL).test(input))
          throw new Error(t('trans.manageSubmissionUsers.exactBCEIDSearch'));
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
});

getSubmissionUsers();
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          color="primary"
          icon
          v-bind="props"
          size="small"
          @click="dialog = true"
        >
          <v-icon icon="mdi:mdi-account-multiple"></v-icon>
        </v-btn>
      </template>
      <span>{{ $t('trans.manageSubmissionUsers.manageTeamMembers') }}</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card>
        <v-card-title class="text-h5 pb-0">
          {{ $t('trans.manageSubmissionUsers.manageTeamMembers') }}
          <v-radio-group v-if="isDraft" v-model="selectedIdp" inline>
            <v-radio label="IDIR" :value="ID_PROVIDERS.IDIR" />
            <v-radio label="Basic BCeID" :value="ID_PROVIDERS.BCEIDBASIC" />
            <v-radio
              label="Business BCeID"
              :value="ID_PROVIDERS.BCEIDBUSINESS"
            />
          </v-radio-group>
        </v-card-title>

        <v-card-text>
          <hr />

          <v-row v-if="isDraft">
            <v-col cols="9">
              <form autocomplete="off">
                <v-autocomplete
                  v-model="userSearchSelection"
                  v-model:search="findUsers"
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
                      v-html="
                        $t('trans.manageSubmissionUsers.userNotFoundErrMsg')
                      "
                    ></div>
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
                @click="addUser"
              >
                <span>{{ $t('trans.manageSubmissionUsers.add') }}</span>
              </v-btn>
            </v-col>
          </v-row>
          <div v-else>
            {{ $t('trans.manageSubmissionUsers.draftFormInvite') }}
          </div>

          <p class="mt-5">
            <strong
              >{{
                $t('trans.manageSubmissionUsers.submissionTeamMembers')
              }}:</strong
            >
          </p>

          <v-skeleton-loader :loading="isLoadingTable" type="table-row">
            <v-table dense>
              <thead>
                <tr>
                  <th class="text-left">
                    {{ $t('trans.manageSubmissionUsers.name') }}
                  </th>
                  <th class="text-left">
                    {{ $t('trans.manageSubmissionUsers.username') }}
                  </th>
                  <th class="text-left">
                    {{ $t('trans.manageSubmissionUsers.email') }}
                  </th>
                  <th v-if="isDraft" class="text-left">
                    {{ $t('trans.manageSubmissionUsers.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in userTableList" :key="item.userId">
                  <td>{{ item.fullName }}</td>
                  <td>{{ item.username }}</td>
                  <td>{{ item.email }}</td>
                  <td v-if="isDraft">
                    <v-btn
                      color="red"
                      icon
                      size="24"
                      :disabled="item.isOwner"
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
          <v-btn class="mb-5 close-dlg" color="primary" @click="dialog = false">
            <span> {{ $t('trans.manageSubmissionUsers.close') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>

      <BaseDialog
        v-model="showDeleteDialog"
        type="CONTINUE"
        @close-dialog="showDeleteDialog = false"
        @continue-dialog="
          modifyPermissions(userToDelete.id, []);
          showDeleteDialog = false;
        "
      >
        <template #title>Remove {{ userToDelete.username }}</template>
        <template #text>
          {{ $t('trans.manageSubmissionUsers.removeUserWarningMsg1') }}
          <strong>{{ userToDelete.username }}</strong
          >? {{ $t('trans.manageSubmissionUsers.removeUserWarningMsg2') }}
        </template>
        <template #button-text-continue>
          <span>{{ $t('trans.manageSubmissionUsers.remove') }}</span>
        </template>
      </BaseDialog>
    </v-dialog>
  </span>
</template>
