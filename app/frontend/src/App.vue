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

function hasPendingRestoreToken() {
  try {
    return !!(
      sessionStorage.getItem('tenantSessionRestore') ||
      localStorage.getItem('tenantLoginRestore')
    );
  } catch (e) {
    return false;
  }
}

const appTitle = computed(() => {
  const base =
    route && route.meta && route.meta.title
      ? route.meta.title
      : import.meta.env.VITE_TITLE || 'Common Hosted Forms';

  if (!tenantStore.isTenantFeatureEnabled) return base;
  // Suppress the suffix only when an actual tenant restore is in flight.
  // Personal-CHEFS-only users get "Personal" immediately, no flicker.
  const restoring =
    tenantStore.isRestoring ||
    (!tenantStore.selectedTenant &&
      tenantStore.loading &&
      hasPendingRestoreToken());
  if (restoring) return base;

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
      <RouterView v-slot="{ Component }">
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
</style>
