<template>
  <v-app>
    <BaseNotificationContainer />
    <BCGovHeader />
    <BCGovNavBar />

    <v-main>
      <transition name="component-fade" mode="out-in">
        <router-view />
      </transition>
      <FirstTimeUserInfoBanner />
    </v-main>

    <BCGovFooter />
  </v-app>
</template>

<script>
import BCGovHeader from '@/components/bcgov/BCGovHeader.vue';
import BCGovFooter from '@/components/bcgov/BCGovFooter.vue';
import BCGovNavBar from '@/components/bcgov/BCGovNavBar.vue';
import FirstTimeUserInfoBanner from '@/components/generic/FirstTimeUserInfoBanner.vue';

export default {
  name: 'App',
  components: {
    FirstTimeUserInfoBanner,
    BCGovHeader,
    BCGovFooter,
    BCGovNavBar,
  },
};
</script>
