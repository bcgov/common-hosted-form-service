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
      <span>Manage Team Members</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card>
        <v-card-title class="text-h5 pb-0"> Manage Team Members </v-card-title>

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
                  label="Enter a name, e-mail, or username"
                  :loading="isLoadingDropdown"
                  return-object
                  :search-input.sync="findUsers"
                >
                  <!-- no data -->
                  <template #no-data>
                    <div class="px-2">
                      Can't find someone? They may not have joined the site.<br />
                      Kindly send them a link to the site and ask them to log
                      in.
                    </div>
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
            <v-simple-table dense>
              <template>
                <thead>
                  <tr>
                    <th class="text-left">Name</th>
                    <th class="text-left">Username</th>
                    <th class="text-left">Email</th>
                    <th class="text-left" v-if="isDraft">Actions</th>
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
          showDeleteDialog = false;"
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

import { FormPermissions, NotificationTypes } from '@/utils/constants';
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
      userSearchResults: [],
      userSearchSelection: null,
    };
  },
  computed: {
    ...mapGetters('form', ['form']),
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
  watch: {
    // Get a list of user objects from database
    async findUsers(input) {
      if (!input) return;
      this.isLoadingDropdown = true;
      try {
        // The form's IDP (only support 1 at a time right now), blank is 'team' and should be IDIR
        const response = await userService.getUsers({
          search: input,
          idpCode: 'idir',
        });
        this.userSearchResults = response.data;
      } catch (error) {
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
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
