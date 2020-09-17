<template>
  <v-card outlined>
    <v-skeleton-loader
      :boilerplate="false"
      class="mx-auto"
      :loading="loading"
      type="card-heading, list-item-three-line@4"
      tile
    >
      <v-list-item three-line>
        <v-list-item-content>
          <div class="overline mb-4">TEAM MANGEMENT</div>
          <div v-for="role in roleList" :key="role.code">
            <div v-if="role.active">
              <v-list-item-title class="headline my-2">{{ role.display }}</v-list-item-title>
              <ul v-for="user in formUsers" :key="user.userId">
                <li v-if="user.roles.includes(role.code)">{{ user.fullName }} ({{ user.username }})</li>
              </ul>
            </div>
          </div>
        </v-list-item-content>
      </v-list-item>
    </v-skeleton-loader>
  </v-card>
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
    };
  },
  methods: {
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
  },
  async mounted() {
    await Promise.all([this.getFormUsers(), this.getRolesList()]);
    this.loading = false;
  },
};
</script>
