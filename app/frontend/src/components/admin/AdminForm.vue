<template>
  <v-tabs>
    <v-tab>Forms</v-tab>
    <v-tab>Users</v-tab>
    <v-tab>Developer</v-tab>

    <v-tab-item> <AdminFormsTable /> </v-tab-item>
    <v-tab-item> <AdminUsersTable /> </v-tab-item>
    <v-tab-item> <Developer /> </v-tab-item>
  </v-tabs>
</template>

<script>
export default {
  components: {
    AdminFormsTable: () => import('@/components/admin/AdminFormsTable.vue'),
    AdminUsersTable: () => import('@/components/admin/AdminUsersTable.vue'),
    Developer: () => import('@/components/admin/Developer.vue'),
  },
};
</script>
