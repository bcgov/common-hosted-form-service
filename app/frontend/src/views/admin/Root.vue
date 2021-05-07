<template>
  <v-container>
    <v-row class="mt-6" no-gutters>
      <v-col cols="12" sm="6">
        <h1>Admin</h1>
      </v-col>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="6">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
              href="https://chefs-metabase.apps.silver.devops.gov.bc.ca/public/dashboard/876f86e4-7c09-4c8d-9205-97dc20267f5f"
            >
              <v-icon>insert_chart</v-icon>
            </v-btn>
          </template>
          <span>Go to Metabase Dashboard</span>
        </v-tooltip>
      </v-col>
    </v-row>
    <AdminPage />
  </v-container>
</template>

<script>
import AdminPage from '@/components/admin/AdminPage.vue';

export default {
  name: 'AdminRoot',
  components: {
    AdminPage,
  },
};
</script>
