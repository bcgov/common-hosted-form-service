<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Team Management</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <span>
          <AddTeamMember
            :disabled="!canManageTeam"
            @adding-users="addingUsers"
            @new-users="addNewUsers"
          />
        </span>
        <span v-if="!isAddingUsers">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>settings</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Manage Form</span>
          </v-tooltip>
        </span>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          class="pb-5"
          :disabled="!canManageTeam"
          hide-details
          label="Search"
          single-line
        />
      </v-col>
    </v-row>

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
      <!-- custom header markup - add tooltip to heading that are roles -->
      <template v-for="h in headers.slice(2)" v-slot:[`header.${h.value}`]="{ headers }">
        <v-tooltip :key="h.value" bottom>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ h.text }}</span>
          </template>
          <span>{{ h.description }}</span>
        </v-tooltip>
      </template>
      <template #item="{ item, isMobile, headers }">
        <!-- if showing in mobile view -->
        <tr v-if="isMobile" class="v-data-table__mobile-table-row">
          <td
            v-for="header in headers"
            :key="header.value"
            class="v-data-table__mobile-row"
          >
            <div class="v-data-table__mobile-row__header">
              <!-- if header is a role with description, add tooltip -->
              <v-tooltip v-if="header.description" bottom>
                <template v-slot:activator="{ on }">
                  <span
                    v-on="on"
                  >{{ header.text }}</span>
                </template>
                <span>{{ header.description }}</span>
              </v-tooltip>
              <!-- else just show text -->
              <span v-else>
                {{ header.text }}
              </span>
            </div>
            <div class="v-data-table__mobile-row__cell">
              <div v-if="typeof item[header.value] === 'boolean'">
                <v-checkbox
                  v-if="disableSubmitter(header.value, userType)"
                  v-model="item[header.value]"
                  disabled
                />
                <v-checkbox
                  v-else
                  v-model="item[header.value]"
                  @click="onCheckboxToggle(item.userId, header.value)"
                  :disabled="updating"
                />
              </div>
              <v-btn
                v-else-if="header.value === 'actions'"
                @click="onRemoveClick(item.userId)"
                color="red"
                :disabled="updating"
                icon
              >
                <v-icon>remove_circle</v-icon>
              </v-btn>
              <div v-else>{{ item[header.value] }}</div>
            </div>
          </td>
        </tr>
        <!-- else display data-table in desktop view -->
        <tr v-else>
          <td
            v-for="header in headers"
            :key="header.value"
            :class="{ 'role-col': typeof item[header.value] === 'boolean' }"
          >
            <div v-if="typeof item[header.value] === 'boolean'">
              <v-checkbox
                v-if="disableSubmitter(header.value, userType)"
                v-model="item[header.value]"
                disabled
              />
              <v-checkbox
                v-else
                v-model="item[header.value]"
                @click="onCheckboxToggle(item.userId, header.value)"
                :disabled="updating"
              />
            </div>
            <v-btn
              v-else-if="header.value === 'actions'"
              @click="onRemoveClick(item.userId)"
              color="red"
              :disabled="updating"
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
      <template #title>Confirm Removal</template>
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
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';

import { rbacService, roleService } from '@/services';
import { IdentityMode, FormPermissions, FormRoleCodes } from '@/utils/constants';
import AddTeamMember from '@/components/forms/manage/AddTeamMember.vue';

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
    ...mapFields('form', ['form.userType']),
    ...mapGetters('form', ['permissions']),
    canManageTeam() {
      return this.permissions.includes(FormPermissions.TEAM_UPDATE);
    },
    roleOrder: () => Object.values(FormRoleCodes),
  },
  data() {
    return {
      edited: false, // Does the table align with formUsers?
      headers: [],
      formUsers: [],
      isAddingUsers: false,
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
    ...mapActions('form', ['fetchForm', 'getFormPermissionsForUser']),
    ...mapActions('notifications', ['addNotification']),
    addingUsers(adding) {
      this.isAddingUsers = adding;
    },
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
            .filter((role) => this.userType === IdentityMode.TEAM || role.code !== FormRoleCodes.FORM_SUBMITTER)
            .map((role) => ({
              filterable: false,
              text: role.display,
              value: role.code,
              description: role.description
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
    // Is this the submitter column, and does this form have login type other than TEAM
    disableSubmitter: (header, userType) =>
      header === FormRoleCodes.FORM_SUBMITTER && userType !== IdentityMode.TEAM,
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
        if (!this.canManageTeam) {
          throw new Error('Insufficient permissions to manage team');
        }
        const response = await rbacService.getFormUsers({
          formId: this.formId,
          roles: '*',
        });
        this.formUsers = response.data;
      } catch (error) {
        this.addNotification({
          message: error.message,
          consoleError: `Error getting form users: ${error}`,
        });
        this.formUsers = [];
      } finally {
        this.createTableData(); // Force refresh table based on latest API response
      }
    },
    async getRolesList() {
      try {
        const response = await roleService.list();
        this.roleList = response.data;
      } catch (error) {
        this.addNotification({
          message: error.message,
          consoleError: `Error getting list of roles: ${error}`,
        });
        this.roleList = [];
      } finally {
        this.createHeaders();
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
        await this.getFormPermissionsForUser(this.formId);
        await this.getFormUsers();
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to update all user roles',
          consoleError: `Error setting all user roles for form ${this.formId}: ${error}`,
        });
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
        await this.getFormPermissionsForUser(this.formId);
        await this.getFormUsers();
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to update roles for a user',
          consoleError: `Error setting user roles for form ${this.formId}: ${error}`,
        });
      }
      this.updating = false;
    },
  },
  async mounted() {
    // TODO: Make sure vuex fetchForm has been called at least once before this
    await Promise.all([
      this.fetchForm(this.formId),
      this.getFormPermissionsForUser(this.formId),
      this.getRolesList()
    ]);
    await this.getFormUsers(),
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
/* remove extra padding on data-table rows for mobile view */
.team-table >>> thead.v-data-table-header-mobile th,
.team-table tr.v-data-table__mobile-table-row td {
  padding: 0;
}
</style>
