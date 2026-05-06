<script setup>
import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';
import GlobalStatusOverlay from '~/components/base/GlobalStatusOverlay.vue';
import BCGovEnterpriseBanner from '~/components/bcgov/BCGovEnterpriseBanner.vue';
import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import BCGovNavBar from './components/bcgov/BCGovNavBar.vue';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';
import { computed, provide, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '~/store/tenant';

const isWideLayout = ref(false);
const ready = ref(false);
const route = useRoute();
const tenantStore = useTenantStore();

const isTenantRestoring = computed(() => tenantStore.isTenantRestoring);

// Show the centered loader on tenant-scoped routes only — public/submitter
// routes don't carry tenant context (interceptors.js excludes them) and
// shouldn't be blocked by a restore happening in another tab.
const showTenantRestoreLoader = computed(
  () => isTenantRestoring.value && !route?.meta?.formSubmitMode
);

const appTitle = computed(() => {
  const base =
    route && route.meta && route.meta.title
      ? route.meta.title
      : import.meta.env.VITE_TITLE || 'Common Hosted Forms';

  if (!tenantStore.isTenantFeatureEnabled) return base;
  if (isTenantRestoring.value) return base;

  const suffix = tenantStore.selectedTenant ? 'Enterprise' : 'Personal';
  return `${base} | ${suffix}`;
});

const isFormSubmitMode = computed(() => {
  return route && route.meta && route.meta.formSubmitMode;
});

const isValidRoute = computed(() => {
  return ['FormSubmit', 'FormView', 'FormSuccess'].includes(route.name);
});

const isWidePage = computed(() => {
  return isWideLayout.value && isValidRoute ? 'main-wide' : 'main';
});

provide('setWideLayout', setWideLayout);

function setWideLayout(isWide) {
  isWideLayout.value = isWide;
}

defineExpose({
  appTitle,
  isValidRoute,
  isWidePage,
  setWideLayout,
  isFormSubmitMode,
  isWideLayout,
});

onMounted(async () => {
  // Initialize tenant store from localStorage
  tenantStore.initializeStore();
  ready.value = true;
});
</script>

<template>
  <v-layout ref="app" class="app">
    <v-main class="app">
      <BaseNotificationContainer />
      <BCGovHeader :app-title="appTitle" :form-submit-mode="isFormSubmitMode" />
      <BCGovNavBar :form-submit-mode="isFormSubmitMode" />
      <BCGovEnterpriseBanner :form-submit-mode="isFormSubmitMode" />
      <GlobalStatusOverlay :parent-ready="ready" />
      <output
        v-if="showTenantRestoreLoader"
        class="tenant-restore-loader main"
        aria-label="Restoring your enterprise context"
      >
        <div class="tenant-restore-card">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
            width="4"
          />
          <div class="tenant-restore-title">
            Restoring your enterprise context&hellip;
          </div>
          <div class="tenant-restore-subtitle">
            One moment while we reconnect you to your tenant.
          </div>
        </div>
      </output>
      <RouterView v-else v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component" :class="isWidePage" />
        </transition>
      </RouterView>
      <BCGovFooter :form-submit-mode="isFormSubmitMode" />
    </v-main>
  </v-layout>
</template>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  -webkit-box-flex: 1;
}

.main {
  flex: 1 0 auto;
}

.main-wide {
  flex: 1 0 auto;
  max-width: 100%;
}

@media (min-width: 1024px) {
  .main-wide {
    padding-left: 65px;
    padding-right: 65px;
  }
}
:deep(.v-btn--icon) {
  border-radius: 0px;
}

.tenant-restore-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem 1rem;
  animation: tenant-restore-fade 200ms ease-out;
}

.tenant-restore-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  max-width: 28rem;
}

.tenant-restore-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #003366;
  margin-top: 0.5rem;
}

.tenant-restore-subtitle {
  font-size: 0.9rem;
  color: #555;
}

@keyframes tenant-restore-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
