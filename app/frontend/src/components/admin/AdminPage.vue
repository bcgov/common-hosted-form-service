<template>
  <v-container fluid>
    <v-tabs v-model="tab">
      <v-tab>Forms</v-tab>
      <v-tab>Users</v-tab>
      <v-tab>Developer</v-tab>
      <v-tab data-cy="infoLinks">Info Links</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item> <AdminFormsTable /> </v-window-item>
      <v-window-item> <AdminUsersTable /> </v-window-item>
      <v-window-item> <Developer /> </v-window-item>
      <v-window-item> <FormComponentsProactiveHelp /> </v-window-item>
    </v-window>
  </v-container>
</template>

<script>
import AdminFormsTable from '@src/components/admin/AdminFormsTable.vue';
import AdminUsersTable from '@src/components/admin/AdminUsersTable.vue';
import Developer from '@src/components/admin/Developer.vue';
import FormComponentsProactiveHelp from '@src/components/admin/FormComponentsProactiveHelp.vue';

export default {
  name: 'AdminPage',
  components: {
    AdminFormsTable,
    AdminUsersTable,
    Developer,
    FormComponentsProactiveHelp,
  },
  data: () => ({
    tab: null,
  }),
};
</script>
