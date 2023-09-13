<script>
import { mapState } from 'pinia';
import AdminFormsTable from '~/components/admin/AdminFormsTable.vue';
import AdminUsersTable from '~/components/admin/AdminUsersTable.vue';
import Dashboard from '~/components/admin/Dashboard.vue';
import Developer from '~/components/admin/Developer.vue';
import FormComponentsProactiveHelp from '~/components/admin/FormComponentsProactiveHelp.vue';

import { useAppStore } from '~/store/app';
import { useFormStore } from '~/store/form';

export default {
  components: {
    AdminFormsTable,
    AdminUsersTable,
    Dashboard,
    Developer,
    FormComponentsProactiveHelp,
  },
  data() {
    return {
      tab: null,
    };
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useFormStore, ['isRTL', 'lang']),
    adminDashboardUrl() {
      return this.config.adminDashboardUrl;
    },
  },
  watch: {
    isRTL() {
      this.tab = null;
    },
  },
};
</script>

<template>
  <v-tabs v-model="tab" :class="{ 'dir-rtl': isRTL }">
    <v-tab value="forms" :lang="lang">{{ $t('trans.adminPage.forms') }}</v-tab>
    <v-tab value="users" :lang="lang">{{ $t('trans.adminPage.users') }}</v-tab>
    <v-tab value="developer" :lang="lang">{{
      $t('trans.adminPage.developer')
    }}</v-tab>
    <v-tab value="infoLinks" :lang="lang">{{
      $t('trans.adminPage.infoLinks')
    }}</v-tab>
    <v-tab v-if="adminDashboardUrl" value="dashboard" :lang="lang">{{
      $t('trans.adminPage.metrics')
    }}</v-tab>
  </v-tabs>

  <v-card-text>
    <v-window v-model="tab">
      <v-window-item value="forms">
        <AdminFormsTable />
      </v-window-item>
      <v-window-item value="users">
        <AdminUsersTable />
      </v-window-item>
      <v-window-item value="developer">
        <Developer />
      </v-window-item>
      <v-window-item value="infoLinks">
        <FormComponentsProactiveHelp />
      </v-window-item>
      <v-window-item value="dashboard">
        <Dashboard :url="adminDashboardUrl" />
      </v-window-item>
    </v-window>
  </v-card-text>
</template>
