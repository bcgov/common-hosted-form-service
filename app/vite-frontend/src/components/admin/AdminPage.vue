<script setup>
import { ref } from 'vue';
import AdminFormsTable from '~/components/admin/AdminFormsTable.vue';
import AdminUsersTable from '~/components/admin/AdminUsersTable.vue';
import Developer from '~/components/admin/Developer.vue';
import FormComponentsProactiveHelp from '~/components/admin/FormComponentsProactiveHelp.vue';

const tab = ref(null);
</script>
<template>
  <v-tabs v-model="tab">
    <v-tab value="forms">{{ $t('trans.adminPage.forms') }}</v-tab>
    <v-tab value="users">{{ $t('trans.adminPage.users') }}</v-tab>
    <v-tab value="developer">{{ $t('trans.adminPage.developer') }}</v-tab>
    <v-tab value="infoLinks">{{ $t('trans.adminPage.infoLinks') }}</v-tab>
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
    </v-window>
  </v-card-text>
</template>
