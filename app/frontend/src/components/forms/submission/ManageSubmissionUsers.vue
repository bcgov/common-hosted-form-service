<script>
import { mapState } from 'pinia';
import { i18n } from '~/internationalization';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { rbacService, userService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  IdentityProviders,
  NotificationTypes,
  Regex,
} from '~/utils/constants';
import { mapActions } from 'pinia';

export default {
  components: {
    BaseDialog,
  },
  props: {
    isDraft: {
      type: Boolean,
      required: true,
    },
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      dialog: false,
      isLoadingTable: true,
      showDeleteDialog: false,
      userTableList: [],
      userToDelete: {},

      findUsers: null,
      isLoadingDropdown: false,
      selectedIdp: IdentityProviders.IDIR,
      userSearchResults: [],
      userSearchSelection: null,
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
    ID_PROVIDERS() {
      return IdentityProviders;
    },
    autocompleteLabel() {
      return this.selectedIdp == IdentityProviders.IDIR
        ? i18n.t('trans.manageSubmissionUsers.requiredFiled')
        : i18n.t('trans.manageSubmissionUsers.exactEmailOrUsername');
    },
  },
  watch: {
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.userSearchResults = [];
      }
    },

    async findUsers(input) {
      if (!input) return;
      this.isLoadingDropdown = true;
      try {
        // The form's IDP (only support 1 at a time right now), blank is 'team' and should be IDIR
        let params = {};
        params.idpCode = this.selectedIdp;
        if (
          this.selectedIdp == IdentityProviders.BCEIDBASIC ||
          this.selectedIdp == IdentityProviders.BCEIDBUSINESS
        ) {
          if (input.length < 6)
            throw new Error(
              i18n.t('trans.manageSubmissionUsers.searchInputLength')
            );
          if (input.includes('@')) {
            if (!new RegExp(Regex.EMAIL).test(input))
              throw new Error(
                i18n.t('trans.manageSubmissionUsers.exactBCEIDSearch')
              );
            else params.email = input;
          } else {
            params.username = input;
          }
        } else {
          params.search = input;
        }
        const response = await userService.getUsers(params);
        this.userSearchResults = response.data;
      } catch (error) {
        // this.userSearchResults = [];
        /* eslint-disable no-console */
        console.error(
          i18n.t('trans.manageSubmissionUsers.getUsersErrMsg', {
            error: error,
          })
        ); // eslint-disable-line no-console
      } finally {
        this.isLoadingDropdown = false;
      }
    },
  },
  created() {
    this.getSubmissionUsers();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    // show users in dropdown that have a text match on multiple properties
    addUser() {
      if (this.userSearchSelection) {
        const id = this.userSearchSelection.id;
        if (this.userTableList.some((u) => u.id === id)) {
          this.addNotification({
            ...NotificationTypes.WARNING,
            text: i18n.t('trans.manageSubmissionUsers.remove', {
              username: this.userSearchSelection.username,
            }),
          });
        } else {
          this.modifyPermissions(id, [
            FormPermissions.SUBMISSION_UPDATE,
            FormPermissions.SUBMISSION_READ,
          ]);
        }
      }
      // reset search field
      this.userSearchSelection = null;
    },

    filterObject(_itemTitle, queryText, item) {
      return Object.values(item.raw)
        .filter((v) => v)
        .some((v) =>
          v.toLocaleLowerCase().includes(queryText.toLocaleLowerCase())
        );
    },

    async getSubmissionUsers() {
      this.isLoadingTable = true;
      try {
        const response = await rbacService.getSubmissionUsers({
          formSubmissionId: this.submissionId,
        });
        if (response.data) {
          this.userTableList = this.transformResponseToTable(response.data);
        }
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.manageSubmissionUsers.getSubmissionUsersErr'),
          consoleError: i18n.t(
            'trans.manageSubmissionUsers.getSubmissionUsersConsoleErr',
            { submissionId: this.submissionId, error: error }
          ),
        });
      } finally {
        this.isLoadingTable = false;
      }
    },

    async modifyPermissions(userId, permissions) {
      this.isLoadingTable = true;
      try {
        const selectedEmail = permissions.length
          ? this.userSearchSelection.email
          : this.userToDelete.email;
        // Add the selected user with read/update permissions on this submission
        const response = await rbacService.setSubmissionUserPermissions(
          { permissions: permissions },
          {
            formSubmissionId: this.submissionId,
            userId: userId,
            selectedUserEmail: selectedEmail,
          }
        );
        if (response.data) {
          this.userTableList = this.transformResponseToTable(response.data);
          this.addNotification({
            ...NotificationTypes.SUCCESS,
            text: permissions.length
              ? i18n.t('trans.manageSubmissionUsers.sentInviteEmailTo') +
                `${selectedEmail}`
              : i18n.t('trans.manageSubmissionUsers.sentUninvitedEmailTo') +
                `${selectedEmail}`,
          });
        }
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.manageSubmissionUsers.updateUserErrMsg'),
          consoleError: i18n.t('trans.manageSubmissionUsers.updateUserErrMsg', {
            submissionId: this.submissionId,
            userId: userId,
            error: error,
          }),
        });
      } finally {
        this.isLoadingTable = false;
      }
    },

    removeUser(userRow) {
      this.userToDelete = userRow;
      this.showDeleteDialog = true;
    },

    transformResponseToTable(responseData) {
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
    },
  },
};
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
          @click="dialog = true"
        >
          <v-icon icon="mdi:mdi-account-multiple"></v-icon>
        </v-btn>
      </template>
      <span :lang="lang">{{
        $t('trans.manageSubmissionUsers.manageTeamMembers')
      }}</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card :class="{ 'dir-rtl': isRTL }">
        <v-card-title class="text-h5 pb-0" :lang="lang">
          {{ $t('trans.manageSubmissionUsers.manageTeamMembers') }}
        </v-card-title>
        <v-card-subtitle>
          <v-radio-group v-if="isDraft" v-model="selectedIdp" inline>
            <v-radio label="IDIR" :value="ID_PROVIDERS.IDIR" />
            <v-radio label="Basic BCeID" :value="ID_PROVIDERS.BCEIDBASIC" />
            <v-radio
              label="Business BCeID"
              :value="ID_PROVIDERS.BCEIDBUSINESS"
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
                  v-model:search="findUsers"
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
                      :lang="lang"
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
                @click="addUser"
              >
                <span :lang="lang"
                  >{{ $t('trans.manageSubmissionUsers.add') }}
                </span>
              </v-btn>
            </v-col>
          </v-row>
          <div v-else :lang="lang">
            {{ $t('trans.manageSubmissionUsers.draftFormInvite') }}
          </div>

          <p class="mt-5" :lang="lang">
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
                  <th :class="isRTL ? 'text-right' : 'text-left'" :lang="lang">
                    {{ $t('trans.manageSubmissionUsers.name') }}
                  </th>
                  <th :class="isRTL ? 'text-right' : 'text-left'" :lang="lang">
                    {{ $t('trans.manageSubmissionUsers.username') }}
                  </th>
                  <th :class="isRTL ? 'text-right' : 'text-left'" :lang="lang">
                    {{ $t('trans.manageSubmissionUsers.email') }}
                  </th>
                  <th
                    v-if="isDraft"
                    :class="isRTL ? 'text-right' : 'text-left'"
                    :lang="lang"
                  >
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
          <v-btn
            class="mb-5 close-dlg"
            color="primary"
            variant="flat"
            @click="dialog = false"
          >
            <span :lang="lang">
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
          <span :lang="lang">
            {{ $t('trans.manageSubmissionUsers.removeUserWarningMsg1') }}
            <strong>{{ userToDelete.username }}</strong
            >? {{ $t('trans.manageSubmissionUsers.removeUserWarningMsg2') }}
          </span>
        </template>
        <template #button-text-continue>
          <span :lang="lang">{{
            $t('trans.manageSubmissionUsers.remove')
          }}</span>
        </template>
      </BaseDialog>
    </v-dialog>
  </span>
</template>
