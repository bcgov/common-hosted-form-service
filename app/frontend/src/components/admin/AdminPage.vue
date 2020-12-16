<template>
  <div>
    <v-tabs>
      <v-tab>Forms</v-tab>
      <v-tab>Users</v-tab>
      <v-tab>Developer</v-tab>

      <v-tab-item> <AdminFormsTable /> </v-tab-item>
      <!-- <v-tab-item> <AdminUsersTable /> </v-tab-item> -->
      <!-- <v-tab-item> <Developer /> </v-tab-item> -->
    </v-tabs>
  </div>
</template>

<script>
import AdminFormsTable from '@/components/admin/AdminFormsTable.vue';

export default {
  components: {
    AdminFormsTable,
  },
  data() {
    return {
      tab: null,
    };
  },
};
</script>

<style lang="scss" scoped>
</style>
