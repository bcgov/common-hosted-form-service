<template>
  <v-tabs>
    <v-tab >Forms</v-tab>
    <v-tab>Users</v-tab>
    <v-tab>Developer</v-tab>
    <v-tab data-cy="infoLinks">Info Links</v-tab>

    <v-tab-item> <AdminFormsTable /> </v-tab-item>
    <v-tab-item> <AdminUsersTable /> </v-tab-item>
    <v-tab-item> <Developer /> </v-tab-item>
    <v-tab-item> <FormComponentsProactiveHelp /> </v-tab-item>
  </v-tabs>
</template>

<script>
export default {
  name: 'AdminPage',
  components: {
    AdminFormsTable: () => import('@/components/admin/AdminFormsTable.vue'),
    AdminUsersTable: () => import('@/components/admin/AdminUsersTable.vue'),
    Developer: () => import('@/components/admin/Developer.vue'),
    FormComponentsProactiveHelp:()=>import('@/components/admin/FormComponentsProactiveHelp.vue'),
  },
};
</script>
