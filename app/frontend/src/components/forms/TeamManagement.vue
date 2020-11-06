<template>
  <div>
    <!-- search input -->
    <div class="team-search mt-6 mt-sm-0">
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        class="pb-5"
      />
    </div>

    <!-- team table -->
    <v-data-table
      class="team-table"
      :headers="headers"
      :items="tableData"
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
              @click="onCheckboxToggle(item.userId)"
              :disabled="updating"
            />
            <div v-else>{{ item[header.value] }}</div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

import { rbacService, roleService } from '@/services';
import { FormRoleCodes } from '@/utils/constants';

export default {
  name: 'TeamManagement',
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
      tableData: [],
      updating: false,
    };
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    addNewUsers(users) {
      if (Array.isArray(users) && users.length) {
        users.forEach((user) => {
          // TODO: Create a new this.tableData object and add it in
          console.log(user); // eslint-disable-line no-console
        });
      }
    },
    createHeaders() {
      const headers = [
        { text: 'Full Name', value: 'fullName', className: '' },
        { text: 'Username', value: 'username', className: '' },
      ];
      this.headers = headers.concat(
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
      );
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
    onCheckboxToggle(userId) {
      this.edited = true;
      this.setUserForms(userId);
    },
    removeUser(userId) {
      // TODO: Consider dialog box to confirm removal of user before executing?
      this.edited = true;

      // Set all of userId's roles to false
      const index = this.tableData.findIndex(u => u.userId === userId);
      this.roleList.forEach(role => this.tableData[index][role.code] = false);

      this.setUserForms(userId);
      this.tableData = this.tableData.filter(u => u.userId !== userId);
    },
    /**
     * @function setFormUsers
     * Sets all users' roles for the form at once
     * @deprecated Use setUserForms instead
     */
    async setFormUsers() {
      this.updating = true;
      try {
        const userRoles = this.tableData.map((user) => this.generateFormRoleUsers(user)).flat();
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
        const user = this.tableData.filter(u => u.userId === userId)[0];
        const userRoles = this.generateFormRoleUsers(user);
        await rbacService.setUserForms(userRoles, {
          formId: this.formId,
          userId: userId,
        });
        await this.getFormUsers();
        this.createTableData(); // Force refresh table based on latest API response
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
.team-search {
  width: 100%;
}

.role-col {
  width: 12%;
}

@media (min-width: 600px) {
  .team-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .team-search {
    padding-left: 16px;
    padding-right: 16px;
  }
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
