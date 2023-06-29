<script>
import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';
import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import BCGovNavBar from './components/bcgov/BCGovNavBar.vue';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';

export default {
  components: {
    BaseNotificationContainer,
    BCGovHeader,
    BCGovNavBar,
    BCGovFooter,
  },
};
</script>

<template>
  <v-layout ref="app">
    <v-main>
      <BaseNotificationContainer />
      <BCGovHeader />
      <BCGovNavBar />
      <RouterView v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
      <BCGovFooter />
    </v-main>
  </v-layout>
</template>
