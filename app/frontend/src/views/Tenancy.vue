<script setup>
import { useTenantStore } from '~/store/tenant';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';
import { useI18n } from 'vue-i18n';
const formStore = useFormStore();

const { isRTL } = storeToRefs(formStore);

const tenantStore = useTenantStore();
const router = useRouter();
const { locale } = useI18n({ useScope: 'global' });

const selectedTenant = ref(tenantStore.selectedTenant);
const showAlert = ref(true);

onMounted(async () => {
  if (!tenantStore.hasTenants) {
    await tenantStore.getTenantsForUser();
  }
});

const confirmTenantSelection = () => {
  if (selectedTenant.value) {
    tenantStore.setSelectedTenant(selectedTenant.value);
    router.push('/'); // Redirect after selection
  }
};

const dismissAlert = () => {
  showAlert.value = false;
};
const setNonTenantedMode = () => {
  tenantStore.selectedTenant = null; // Clear any selected tenant
  tenantStore.nonTenantedMode = true; // Enable non-tenanted access
  router.push('/'); // Redirect to home
};
</script>
<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-container class="tenancy-layout d-flex flex-column justify-end">
      <v-sheet class="help-highlight pa-5" elevation="2">
        <v-row justify="center">
          <!-- Title and Close Button -->
          <v-col cols="11">
            <strong class="text-primary">New Feature Alert!</strong>
            <span class="text-h6 font-weight-bold">
              CHEFS now supports Multi-Tenancy</span
            >
          </v-col>
          <v-col cols="1" class="text-right">
            <v-btn icon @click="dismissAlert">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <!-- Description -->
        <p class="mt-2">
          You can now manage forms across multiple teams (tenancies) while
          keeping data, settings, and permissions separate.
        </p>

        <!-- Bullet Points -->
        <ul>
          <li>
            Switch Between Tenancies – Select the tenancy you want to work in
            from your available list.
          </li>
          <li>
            Access the Older Version – Choose
            <strong>"Non-tenanted CHEFS"</strong> to return to the previous
            setup.
          </li>
        </ul>

        <!-- Learn More Link -->
        <p :lang="locale">
          <a
            href="https://developer.gov.bc.ca/docs/default/component/chefs-techdocs"
            target="_blank"
            :lang="locale"
            >Learn more about Multi-Tenancy</a
          >
        </p>
      </v-sheet>
    </v-container>
    <!-- Tenancy Selection -->
    <v-container class="tenancy-layout d-flex flex-column justify-end">
      <v-row
        ><v-col cols="12" md="4"><span>Choose a Tenancy</span></v-col></v-row
      >
      <v-row>
        <!-- Dropdown for tenancy selection -->
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedTenant"
            label="Select an option"
            :items="tenantStore.tenants"
            item-title="name"
            item-value="id"
            variant="outlined"
            class="tenancy-dropdown"
          ></v-select>
        </v-col>
      </v-row>
      <v-row>
        <!-- Button to proceed (Disabled when no tenancy is selected) -->
        <v-col cols="12" md="4">
          <v-btn
            :disabled="!selectedTenant"
            color="primary"
            @click="confirmTenantSelection"
          >
            Go to Tenanted CHEFS →
          </v-btn>
        </v-col>

        <!-- Non-tenanted CHEFS link -->
        <v-col cols="12" md="4" class="text-right">
          <a class="non-tenanted-link" @click="setNonTenantedMode">
            Non-tenanted CHEFS ("Existing" CHEFS)
          </a>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.non-tenanted-link {
  font-size: 1.1rem; /* Slightly larger text */
  font-weight: bold; /* Make it stand out */
  color: #1976d2 !important; /* Use a vibrant primary color */
  text-decoration: underline; /* Ensure it's noticeable as a link */
  padding: 10px; /* Add padding around the text */
  display: inline-block; /* Make it flow naturally */
  transition: color 0.3s ease-in-out; /* Smooth hover effect */

  &:hover {
    color: #0d47a1; /* Darker blue on hover */
    text-decoration: none; /* Optional: Remove underline on hover */
  }
}
.tenancy-alert {
  width: 90%;
  max-width: 900px;
  margin: auto;
}
.tenancy-layout {
  width: 80%;

  .example-text {
    margin: 80px 0;
    padding: 0 5px;
  }
}
</style>
