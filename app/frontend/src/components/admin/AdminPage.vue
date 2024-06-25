<script>
import { mapState } from 'pinia';
import { useI18n } from 'vue-i18n';

import AdminFormsTable from '~/components/admin/AdminFormsTable.vue';
import AdminUsersTable from '~/components/admin/AdminUsersTable.vue';
import AdminAPIsTable from '~/components/admin/AdminAPIsTable.vue';
import Dashboard from '~/components/admin/Dashboard.vue';
import Developer from '~/components/admin/Developer.vue';
import FormComponentsProactiveHelp from '~/components/admin/FormComponentsProactiveHelp.vue';

import { useAppStore } from '~/store/app';
import { useFormStore } from '~/store/form';

export default {
  components: {
    AdminFormsTable,
    AdminUsersTable,
    AdminAPIsTable,
    Dashboard,
    Developer,
    FormComponentsProactiveHelp,
  },
  setup() {
    const { locale } = useI18n({ useScope: 'global' });

    return { locale };
  },
  data() {
    return {
      tab: null,
    };
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useFormStore, ['isRTL']),
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
    <v-tab value="forms" :lang="locale">{{
      $t('trans.adminPage.forms')
    }}</v-tab>
    <v-tab value="users" :lang="locale">{{
      $t('trans.adminPage.users')
    }}</v-tab>
    <v-tab value="apis" :lang="locale">{{ $t('trans.adminPage.apis') }}</v-tab>
    <v-tab value="developer" :lang="locale">{{
      $t('trans.adminPage.developer')
    }}</v-tab>
    <v-tab value="infoLinks" :lang="locale">{{
      $t('trans.adminPage.infoLinks')
    }}</v-tab>
    <v-tab v-if="adminDashboardUrl" value="dashboard" :lang="locale">{{
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
      <v-window-item value="apis">
        <AdminAPIsTable />
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
