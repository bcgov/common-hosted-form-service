<template>
  <v-tabs :class="{ 'dir-rtl': isRTL }">
    <v-tab>{{ $t('trans.adminPage.forms') }}</v-tab>
    <v-tab>{{ $t('trans.adminPage.users') }}</v-tab>
    <v-tab>{{ $t('trans.adminPage.developer') }}</v-tab>
    <v-tab data-cy="infoLinks">{{ $t('trans.adminPage.infoLinks') }}</v-tab>
    <v-tab v-if="adminDashboardUrl">{{ $t('trans.adminPage.metrics') }}</v-tab>

    <v-tab-item> <AdminFormsTable /> </v-tab-item>
    <v-tab-item> <AdminUsersTable /> </v-tab-item>
    <v-tab-item> <Developer /> </v-tab-item>
    <v-tab-item> <FormComponentsProactiveHelp /> </v-tab-item>
    <v-tab-item> <Dashboard :url="adminDashboardUrl" /> </v-tab-item>
  </v-tabs>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'AdminPage',
  components: {
    AdminFormsTable: () => import('@/components/admin/AdminFormsTable.vue'),
    AdminUsersTable: () => import('@/components/admin/AdminUsersTable.vue'),
    Dashboard: () => import('@/components/admin/Dashboard.vue'),
    Developer: () => import('@/components/admin/Developer.vue'),
    FormComponentsProactiveHelp: () =>
      import('@/components/admin/FormComponentsProactiveHelp.vue'),
  },
  data() {
    return {
      index: 2,
      adminDashboardUrl: this.$config.adminDashboardUrl,
    };
  },
  computed: {
    ...mapGetters('form', ['isRTL', 'multiLanguage']),
  },
};
</script>
<style lang="css">
.dir-rtl {
  direction: rtl !important;
  text-align: right;
}
</style>
