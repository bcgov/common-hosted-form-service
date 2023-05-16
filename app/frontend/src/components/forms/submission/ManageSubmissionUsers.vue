<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          @click="dialog = true"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>group</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('trans.manageSubmissionUsers.manageTeamMembers') }}</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card>
        <v-card-title class="text-h5 pb-0">
          {{ $t('trans.manageSubmissionUsers.manageTeamMembers') }}
          <v-radio-group v-model="selectedIdp" row>
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
                  autocomplete="autocomplete_off"
                  v-model="userSearchSelection"
                  clearable
                  dense
                  :filter="filterObject"
                  hide-details
                  :items="userSearchResults"
                  :label="autocompleteLabel"
                  :loading="isLoadingDropdown"
                  return-object
                  :search-input.sync="findUsers"
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
                  <!-- selected user -->
                  <template #selection="data">
                    <span
                      v-bind="data.attrs"
                      :input-value="data.selected"
                      close
                      @click="data.select"
                    >
                      {{ data.item.fullName }}
                    </span>
                  </template>
                  <!-- users found in dropdown -->
                  <template #item="data">
                    <template v-if="typeof data.item !== 'object'">
                      <v-list-item-content v-text="data.item" />
                    </template>
                    <template v-else>
                      <v-list-item-content>
                        <v-list-item-title>
                          {{ data.item.fullName }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{ data.item.username }} ({{ data.item.idpCode }})
                        </v-list-item-subtitle>
                        <v-list-item-subtitle>
                          {{ data.item.email }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </template>
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
            <v-simple-table dense>
              <template>
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
                    <th class="text-left" v-if="isDraft">
                      {{ $t('trans.manageSubmissionUsers.actions') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr :key="item.userId" v-for="item in userTableList">
                    <td>{{ item.fullName }}</td>
                    <td>{{ item.username }}</td>
                    <td>{{ item.email }}</td>
                    <td v-if="isDraft">
                      <v-btn
                        color="red"
                        icon
                        :disabled="item.isOwner"
                        @click="removeUser(item)"
                      >
                        <v-icon>remove_circle</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
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

<script>
import { mapActions, mapGetters } from 'vuex';

import {
  FormPermissions,
  IdentityProviders,
  NotificationTypes,
  Regex,
} from '@/utils/constants';
import { rbacService, userService } from '@/services';

export default {
  name: 'ManageSubmissionUsers',
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

      // search box
      findUsers: null,
      isLoadingDropdown: false,
      selectedIdp: IdentityProviders.IDIR,
      userSearchResults: [],
      userSearchSelection: null,
    };
  },
  computed: {
    ...mapGetters('form', ['form']),
    ID_PROVIDERS() {
      return IdentityProviders;
    },
    autocompleteLabel() {
      return this.selectedIdp == IdentityProviders.IDIR
        ? this.$t('trans.manageSubmissionUsers.requiredFiled')
        : this.$t('trans.manageSubmissionUsers.exactEmailOrUsername');
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    // show users in dropdown that have a text match on multiple properties
    addUser() {
      if (this.userSearchSelection) {
        const id = this.userSearchSelection.id;
        if (this.userTableList.some((u) => u.id === id)) {
          this.addNotification({
            ...NotificationTypes.WARNING,
            message: this.$t('trans.manageSubmissionUsers.remove', {
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
    filterObject(item, queryText) {
      return Object.values(item)
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
          message: this.$t('trans.manageSubmissionUsers.getSubmissionUsersErr'),
          consoleError: this.$t(
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
            message: permissions.length
              ? this.$t('trans.manageSubmissionUsers.sentInviteEmailTo') +
                `${selectedEmail}`
              : this.$t('trans.manageSubmissionUsers.sentUninvitedEmailTo') +
                `${selectedEmail}`,
          });
        }
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.manageSubmissionUsers.updateUserErrMsg'),
          consoleError: this.$t(
            'trans.manageSubmissionUsers.updateUserErrMsg',
            { submissionId: this.submissionId, userId: userId, error: error }
          ),
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
  watch: {
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.userSearchResults = [];
      }
    },
    // Get a list of user objects from database
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
              this.$t('trans.manageSubmissionUsers.searchInputLength')
            );
          if (input.includes('@')) {
            if (!new RegExp(Regex.EMAIL).test(input))
              throw new Error(
                this.$t('trans.manageSubmissionUsers.exactBCEIDSearch')
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
          this.$t('trans.manageSubmissionUsers.getUsersErrMsg', {
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
};
</script>
