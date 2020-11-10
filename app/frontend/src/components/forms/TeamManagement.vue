<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <v-col cols="12" sm="4">
        <h1 class="inline">Team Management</h1>
      </v-col>
      <v-spacer />
      <v-col sm="4" class="pt-0">
        <!-- search input -->
        <div class>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            hide-details
            dense
          />
        </div>
      </v-col>
    </v-row>

    <AddTeamMember @new-users="addNewUsers" />

    <!-- team table -->
    <v-data-table
      class="team-table"
      :headers="headers"
      :items="tableData"
      :key="updateTableKey"
      :loading="loading || updating"
      loading-text="Loading... Please wait"
      no-data-text="Failed to load team role data"
      :search="search"
    >
      <template #item="{ item, isMobile, headers }">
        <tr v-if="isMobile" class="v-data-table__mobile-table-row">
          <td
            v-for="header in headers"
            :key="header.value"
            class="v-data-table__mobile-row"
          >
            <div class="v-data-table__mobile-row__header">
              {{ header.text }}
            </div>
            <div class="v-data-table__mobile-row__cell">
              <v-checkbox
                v-if="typeof item[header.value] === 'boolean'"
                v-model="item[header.value]"
                @click="onCheckboxToggle(item.userId)"
                :disabled="updating"
              />
              <v-btn
                v-else-if="header.value === 'actions'"
                @click="onRemoveClick(item.userId)"
                color="red"
                icon
              >
                <v-icon>remove_circle</v-icon>
              </v-btn>
              <div v-else>{{ item[header.value] }}</div>
            </div>
          </td>
        </tr>
        <tr v-else>
          <td
            v-for="header in headers"
            :key="header.value"
            :class="{ 'role-col': typeof item[header.value] === 'boolean' }"
          >
            <v-checkbox
              v-if="typeof item[header.value] === 'boolean'"
              v-model="item[header.value]"
              @click="onCheckboxToggle(item.userId, header.value)"
              :disabled="updating"
            />
            <v-btn
              v-else-if="header.value === 'actions'"
              @click="onRemoveClick(item.userId)"
              color="red"
              icon
            >
              <v-icon>remove_circle</v-icon>
            </v-btn>
            <div v-else>{{ item[header.value] }}</div>
          </td>
        </tr>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="
        showDeleteDialog = false;
        userId = '';
      "
      @continue-dialog="removeUser"
    >
      <template #text>
        Are you sure you want to remove this team member?
      </template>
      <template #button-text-continue>
        <span>Remove</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

import { rbacService, roleService } from '@/services';
import { FormRoleCodes } from '@/utils/constants';
import AddTeamMember from '@/components/forms/AddTeamMember.vue';

export default {
  name: 'TeamManagement',
  components: {
    AddTeamMember,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  computed: {
    roleOrder: () => Object.values(FormRoleCodes),
  },
  data() {
    return {
      edited: false, // Does the table align with formUsers?
      headers: [],
      formUsers: [],
      loading: true,
      roleList: [],
      search: '',
      showDeleteDialog: false,
      tableData: [],
      userId: '',
      updateTableKey: 0,
      updating: false,
    };
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    addNewUsers(users) {
      if (Array.isArray(users) && users.length) {
        users.forEach((user) => {
          // if user isnt already in the table
          if (!this.tableData.some((obj) => obj.userId === user.id)) {
            // create new object for table row
            this.tableData.push({
              formId: this.formId,
              userId: user.id,
              form_submitter: false,
              form_designer: false,
              submission_reviewer: false,
              team_manager: false,
              owner: false,
              fullName: user.fullName,
              username: user.username,
            });
          }
        });
      }
    },
    canRemoveOwner(userId) {
      if (
        this.tableData.reduce((acc, user) => (user.owner ? acc + 1 : acc), 0) <
        2
      ) {
        this.addNotification({
          message: 'There must always be at least one form owner',
          consoleError: `Cannot remove ${userId} as they are the only remaining owner of this form.`,
        });
        return false;
      }
      return true;
    },
    createHeaders() {
      const headers = [
        { text: 'Full Name', value: 'fullName' },
        { text: 'Username', value: 'username' },
      ];
      this.headers = headers
        .concat(
          this.roleList
            .map((role) => ({
              filterable: false,
              text: role.display,
              value: role.code,
            }))
            .sort((a, b) =>
              this.roleOrder.indexOf(a.value) > this.roleOrder.indexOf(b.value)
                ? 1
                : -1
            )
        )
        .concat({ text: '', value: 'actions', width: '1rem' });
    },
    createTableData() {
      this.tableData = this.formUsers.map((user) => {
        const row = {
          formId: this.formId,
          fullName: user.fullName,
          userId: user.userId,
          username: user.username,
        };
        this.roleList
          .map((role) => role.code)
          .forEach((role) => (row[role] = user.roles.includes(role)));
        return row;
      });
      this.edited = false;
    },
    generateFormRoleUsers(user) {
      return Object.keys(user)
        .filter((role) => this.roleOrder.includes(role) && user[role])
        .map((role) => ({
          formId: user.formId,
          role: role,
          userId: user.userId,
        }));
    },
    async getFormUsers() {
      try {
        const response = await rbacService.getFormUsers({
          formId: this.formId,
          roles: '*',
        });
        this.formUsers = response.data;
      } catch (error) {
        console.error(`Error getting form users: ${error}`); // eslint-disable-line no-console
      }
    },
    async getRolesList() {
      try {
        const response = await roleService.list();
        this.roleList = response.data;
      } catch (error) {
        console.error(`Error getting list of roles: ${error}`); // eslint-disable-line no-console
      }
    },
    onCheckboxToggle(userId, header) {
      const ownerCount = this.tableData.reduce(
        (acc, user) => (user.owner ? acc + 1 : acc),
        0
      );
      const index = this.tableData.findIndex((u) => u.userId === userId);
      if (header === 'owner' && ownerCount === 0) {
        // Rollback attempted last owner removal and exit
        if (!this.tableData[index].owner) {
          this.tableData[index].owner = true;
          this.updateTableKey += 1;
          this.ownerError(userId);
          return;
        }
      }
      this.edited = true;
      this.setUserForms(userId);
    },
    onRemoveClick(userId) {
      const ownerCount = this.tableData.reduce(
        (acc, user) => (user.owner ? acc + 1 : acc),
        0
      );
      const index = this.tableData.findIndex((u) => u.userId === userId);

      if (this.tableData[index].owner && ownerCount === 1) {
        this.ownerError(userId);
      } else {
        this.userId = userId;
        this.showDeleteDialog = true;
      }
    },
    ownerError(userId) {
      this.addNotification({
        message: 'There must always be at least one form owner',
        consoleError: `Cannot remove ${userId} as they are the only remaining owner of this form.`,
      });
    },
    removeUser() {
      this.showDeleteDialog = false;
      this.edited = true;

      // Set all of userId's roles to false
      const index = this.tableData.findIndex((u) => u.userId === this.userId);
      this.roleList.forEach(
        (role) => (this.tableData[index][role.code] = false)
      );

      this.setUserForms(this.userId);
      this.tableData = this.tableData.filter((u) => u.userId !== this.userId);
      this.userId = '';
    },
    /**
     * @function setFormUsers
     * Sets all users' roles for the form at once
     * @deprecated Use setUserForms instead
     */
    async setFormUsers() {
      this.updating = true;
      try {
        const userRoles = this.tableData
          .map((user) => this.generateFormRoleUsers(user))
          .flat();
        await rbacService.setFormUsers(userRoles, {
          formId: this.formId,
        });
        await this.getFormUsers();
        this.createTableData(); // Force refresh table based on latest API response
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to update all user roles',
          consoleError: `Error setting all user roles for form ${this.formId}: ${error}`,
        });
        this.createTableData(); // Force refresh table based on latest API response
      }
      this.updating = false;
    },
    /**
     * @function setUserForms
     * Sets `userId`'s roles for the form
     * @param {String} userId The userId to be updated
     */
    async setUserForms(userId) {
      this.updating = true;
      try {
        const user = this.tableData.filter((u) => u.userId === userId)[0];
        const userRoles = this.generateFormRoleUsers(user);
        await rbacService.setUserForms(userRoles, {
          formId: this.formId,
          userId: userId,
        });
        await this.getFormUsers();
        // this.createTableData(); // Force refresh table based on latest API response
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to update roles for a user',
          consoleError: `Error setting user roles for form ${this.formId}: ${error}`,
        });
        this.createTableData(); // Force refresh table based on latest API response
      }
      this.updating = false;
    },
  },
  async mounted() {
    await Promise.all([this.getFormUsers(), this.getRolesList()]);
    this.createHeaders();
    this.createTableData();
    this.loading = false;
  },
};
</script>

<style scoped>
.role-col {
  width: 12%;
}
.team-table {
  clear: both;
}
@media (max-width: 1263px) {
  .team-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.team-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.team-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
