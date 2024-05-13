<script setup>
import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';
import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import BCGovNavBar from './components/bcgov/BCGovNavBar.vue';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';
import { computed, provide, ref } from 'vue';
import { useRoute } from 'vue-router';

const isWideLayout = ref(false);
const route = useRoute();

const appTitle = computed(() => {
  return route && route.meta && route.meta.title
    ? route.meta.title
    : import.meta.env.VITE_TITLE;
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
</script>

<template>
  <v-layout ref="app" class="app">
    <v-main class="app">
      <BaseNotificationContainer />
      <BCGovHeader :app-title="appTitle" :form-submit-mode="isFormSubmitMode" />
      <BCGovNavBar :form-submit-mode="isFormSubmitMode" />
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
</style>
