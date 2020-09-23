<template>
  <div>
    <v-card outlined>
      <v-skeleton-loader :boilerplate="false" class="mx-auto" :loading="loading" type="table">
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th>
                  <div>User</div>
                </th>
                <th v-for="role in roleList" :key="role.code">
                  <div v-if="role.active">{{ role.display }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in tableData" :key="user.userId">
                <td>{{ user.fullName }} ({{ user.username }})</td>
                <td v-for="role in Object.keys(user.roles)" :key="role">
                  <v-checkbox v-model="tableData[index].roles[role]" />
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-skeleton-loader>
    </v-card>
    <v-btn color="primary" class="my-2" @click="submitFormSchema">
      <span>Update Permissions</span>
    </v-btn>
  </div>
</template>

<script>
import { rbacService, roleService } from '@/services';

export default {
  name: 'TeamManagement',
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      formUsers: [],
      loading: true,
      roleList: [],
      tableData: [],
    };
  },
  methods: {
    createTableData() {
      const roleCodes = this.roleList.map((role) => role.code);
      this.tableData = this.formUsers.map((user) => {
        const row = {
          formId: this.formId,
          fullName: user.fullName,
          roles: {},
          userId: user.userId,
          username: user.username,
        };
        roleCodes.forEach((role) => {
          row.roles[role] = user.roles.includes(role);
        });

        console.log('tableData', row); // eslint-disable-line no-console
        return row;
      });
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
      try {
        const response = await rbacService.setFormUsers({
          formId: this.formId,
        });
        console.log('setFormUsers', response.data); // eslint-disable-line no-console
      } catch (error) {
        console.error(`Error setting form users: ${error}`); // eslint-disable-line no-console
      }
    },
  },
  async mounted() {
    await Promise.all([this.getFormUsers(), this.getRolesList()]);
    this.createTableData();
    this.loading = false;
  },
};
</script>
