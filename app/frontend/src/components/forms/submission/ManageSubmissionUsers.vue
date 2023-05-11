<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn color="primary" icon v-bind="props" @click="dialog = true">
          <v-icon>group</v-icon>
        </v-btn>
      </template>
      <span>Manage Team Members</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card>
        <v-card-title class="text-h5 pb-0">
          Manage Team Members
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
                  v-model="userSearchSelection"
                  v-model:search="findUsers"
                  :items="items"
                  chips
                  closable-chips
                  clearable
                  item-title="fullName"
                  density="compact"
                  :customFilter="filterObject"
                  hide-details
                  :label="autocompleteLabel"
                  :loading="isLoadingDropdown"
                  return-object
                >
                  <!-- no data -->
                  <template v-slot:no-data>
                    <div class="px-2">
                      Can't find someone? They may not have logged into
                      CHEFS.<br />
                      Kindly send them a link to CHEFS and ask them to log in.
                    </div>
                  </template>
                  <template v-slot:chip="{ props, item }">
                    <v-chip v-bind="props" :text="item?.raw?.fullName"></v-chip>
                  </template>

                  <!-- users found in dropdown -->
                  <template v-slot:item="{ props, item }">
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
                <span>Add</span>
              </v-btn>
            </v-col>
          </v-row>
          <div v-else>
            You can only invite and manage team members while this form is a
            draft
          </div>

          <p class="mt-5">
            <strong>Team members for this submission:</strong>
          </p>

          <v-skeleton-loader :loading="isLoadingTable" type="table-row">
            <v-table dense>
              <thead>
                <tr>
                  <th class="text-left">Name</th>
                  <th class="text-left">Username</th>
                  <th class="text-left">Email</th>
                  <th v-if="isDraft" class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in userTableList" :key="item.id">
                  <td>{{ item.fullName }}</td>
                  <td>{{ item.username }}</td>
                  <td>{{ item.email }}</td>
                  <td v-if="isDraft">
                    <v-btn
                      color="red"
                      :disabled="item.isOwner"
                      @click="removeUser(item)"
                      icon="mdi-minus-thick"
                      size="x-small"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-skeleton-loader>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 close-dlg" color="primary" @click="dialog = false">
            <span>Close</span>
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
          Are you sure you wish to remove
          <strong>{{ userToDelete.username }}</strong
          >? They will no longer have permissions for this submission.
        </template>
        <template #button-text-continue>
          <span>Remove</span>
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
} from '@src/utils/constants';
import { rbacService, userService } from '@src/services';

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
        ? 'Enter a name, e-mail, or username'
        : 'Enter an exact e-mail or username.';
    },
    items() {
      return this.userSearchResults;
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
              'Search input for BCeID username/email must be greater than 6 characters.'
            );
          if (input.includes('@')) {
            if (!new RegExp(Regex.EMAIL).test(input))
              throw new Error('Email searches for BCeID must be exact.');
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
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
      } finally {
        this.isLoadingDropdown = false;
      }
    },
  },
  created() {
    this.getSubmissionUsers();
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
            message: `User ${this.userSearchSelection.username} is already in the list of team members.`,
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
          message:
            'An error occured while trying to fetch users for this submission.',
          consoleError: `Error getting users for ${this.submissionId}: ${error}`,
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
              ? `Sent invite email to ${selectedEmail}`
              : `Sent uninvited email to ${selectedEmail}`,
          });
        }
      } catch (error) {
        this.addNotification({
          message:
            'An error occured while trying to update users for this submission.',
          consoleError: `Error setting user permissions. Sub: ${this.submissionId} User: ${userId} Error: ${error}`,
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
