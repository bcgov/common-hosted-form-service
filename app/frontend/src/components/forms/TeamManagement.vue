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
      <template v-slot:item="{ item, isMobile, headers }">
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
                @click="edited = true"
              />
              <div v-else>{{ item[header.value] }}</div>
            </div>
          </td>
        </tr>
        <tr v-else>
          <td v-for="header in headers" :key="header.value" :class="{'role-col': typeof item[header.value] === 'boolean'}">
            <v-checkbox
              v-if="typeof item[header.value] === 'boolean'"
              v-model="item[header.value]"
              @click="edited = true"
            />
            <div v-else>{{ item[header.value] }}</div>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-btn
      color="primary"
      class="my-2"
      :disabled="!edited"
      :loading="updating"
      @click="setFormUsers"
    >
      <span>UPDATE</span>
    </v-btn>
    <v-btn
      color="secondary"
      class="my-2 ml-2"
      :disabled="!edited"
      @click="createTableData"
    >
      <span>ROLLBACK</span>
    </v-btn>
  </div>
</template>

<script>
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
      edited: false,
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
    generateUserRoles() {
      const body = [];
      this.tableData.forEach((user) => {
        Object.keys(user)
          .filter((role) => this.roleOrder.includes(role))
          .forEach((role) => {
            if (user[role]) {
              body.push({
                formId: user.formId,
                role: role,
                userId: user.userId,
              });
            }
          });
      });
      return body;
    },
    async getFormUsers() {
      try {
        const response = await rbacService.getFormUsers({
          formId: this.formId,
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
    async setFormUsers() {
      this.updating = true;
      try {
        const userRoles = this.generateUserRoles();
        const response = await rbacService.setFormUsers(userRoles, {
          formId: this.formId,
        });
        this.formUsers = response.data;
        this.createTableData();
        this.edited = false;
      } catch (error) {
        console.error(`Error setting form users: ${error}`); // eslint-disable-line no-console
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
