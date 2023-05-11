<template>
  <v-app>
    <BaseNotificationContainer />
    <BCGovHeader />
    <BCGovNavBar />

    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </v-main>

    <BCGovFooter />
  </v-app>
</template>

<script>
import BaseNotificationContainer from '@src/components/base/BaseNotificationContainer.vue';
import BCGovHeader from '@src/components/bcgov/BCGovHeader.vue';
import BCGovFooter from '@src/components/bcgov/BCGovFooter.vue';
import BCGovNavBar from '@src/components/bcgov/BCGovNavBar.vue';

export default {
  name: 'App',
  components: {
    BaseNotificationContainer,
    BCGovHeader,
    BCGovFooter,
    BCGovNavBar,
  },
};
</script>
