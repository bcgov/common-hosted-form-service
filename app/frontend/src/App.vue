<template>
  <v-app>
    <BaseNotificationContainer />
    <BCGovHeader />
    <BCGovNavBar />

    <v-main>
      <transition name="component-fade" mode="out-in">
        <router-view />
      </transition>
      <BaseWarningDialog />
    </v-main>

    <BCGovFooter />
  </v-app>
</template>

<script>
import BCGovHeader from '@/components/bcgov/BCGovHeader.vue';
import BCGovFooter from '@/components/bcgov/BCGovFooter.vue';
import BCGovNavBar from '@/components/bcgov/BCGovNavBar.vue';
import BaseWarningDialog from '@/components/base/BaseWarningDialog.vue';

export default {
  name: 'App',
  components: {
    BCGovHeader,
    BCGovFooter,
    BCGovNavBar,
    BaseWarningDialog,
  },
};
</script>
