<template>
  <div class="tenancy-container">
    <div class="alert-box">
      <span class="close-btn" @click="dismissAlert">&times;</span>
      <h2>
        <strong>New Feature Alert!</strong> CHEFS now supports Multi-Tenancy
      </h2>
      <p>
        You can now manage forms across multiple teams (tenancies) while keeping
        data, settings, and permissions separate.
      </p>
      <ul>
        <li>
          🔹 Switch Between Tenancies – Select the tenancy you want to work in
          from your available list.
        </li>
        <li>
          🔹 Access the Older Version – Choose "Non-tenanted CHEFS" to return to
          the previous setup.
        </li>
      </ul>
      <a href="#">Learn more about Multi-Tenancy</a>
    </div>

    <div class="selection-container">
      <label for="tenantSelect">Choose a Tenancy</label>
      <select id="tenantSelect" v-model="selectedTenant">
        <option disabled value="">Select an option...</option>
        <option
          v-for="tenant in tenantStore.tenants"
          :key="tenant.id"
          :value="tenant"
        >
          {{ tenant.name }}
        </option>
      </select>
      <button
        :disabled="!selectedTenant"
        class="confirm-btn"
        @click="confirmTenantSelection"
      >
        Go to Tenanted CHEFS →
      </button>
      <a href="#" class="old-chefs-link">Non-tenanted CHEFS ("Old" CHEFS)</a>
    </div>
  </div>
</template>

<script>
import { useTenantStore } from '~/store/tenant';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const tenantStore = useTenantStore();
    const router = useRouter();
    const selectedTenant = ref(null);

    onMounted(async () => {
      if (!tenantStore.hasTenants) {
        await tenantStore.getTenantsForUser();
      }
    });

    const confirmTenantSelection = () => {
      if (selectedTenant.value) {
        tenantStore.setSelectedTenant(selectedTenant.value);
        router.push('/'); // Redirect to the About page
      }
    };

    const dismissAlert = () => {
      document.querySelector('.alert-box').style.display = 'none';
    };

    return {
      tenantStore,
      selectedTenant,
      confirmTenantSelection,
      dismissAlert,
    };
  },
};
</script>

<style scoped>
.tenancy-container {
  max-width: 700px;
  margin: auto;
  text-align: center;
  padding: 20px;
}

.alert-box {
  background: #eef5ff;
  padding: 15px;
  border-left: 5px solid #0053a0;
  margin-bottom: 20px;
  position: relative;
  text-align: left;
}

.alert-box h2 {
  color: #003366;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 20px;
  cursor: pointer;
}

.selection-container {
  margin-top: 20px;
}

select {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
}

.confirm-btn {
  background: #0053a0;
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.old-chefs-link {
  display: block;
  margin-top: 10px;
  text-decoration: underline;
}
</style>
