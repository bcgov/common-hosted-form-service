<template>
  <div>
    <v-tabs>
      <v-tab>Forms</v-tab>
      <v-tab>Users</v-tab>
      <v-tab>Developer</v-tab>

      <v-tab-item> <AdminFormsTable /> </v-tab-item>
      <v-tab-item> <AdminUsersTable /> </v-tab-item>
      <v-tab-item> <Developer /> </v-tab-item>
    </v-tabs>
  </div>
</template>

<script>
import AdminFormsTable from '@/components/admin/AdminFormsTable.vue';
import AdminUsersTable from '@/components/admin/AdminUsersTable.vue';
import Developer from '@/components/admin/Developer.vue';

export default {
  name: 'AdminPage',
  components: {
    AdminFormsTable,
    AdminUsersTable,
    Developer,
  },
};
</script>
