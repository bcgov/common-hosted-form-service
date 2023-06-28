<template>
  <v-app :class="{ 'dir-rtl': isRtl }">
    <BaseNotificationContainer />
    <BCGovHeader />
    <BCGovNavBar />
    <v-main>
      <transition name="component-fade" mode="out-in">
        <router-view />
      </transition>
    </v-main>

    <BCGovFooter />
  </v-app>
</template>

<script>
import BCGovHeader from '@/components/bcgov/BCGovHeader.vue';
import BCGovFooter from '@/components/bcgov/BCGovFooter.vue';
import BCGovNavBar from '@/components/bcgov/BCGovNavBar.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    BCGovHeader,
    BCGovFooter,
    BCGovNavBar,
  },
  computed: {
    ...mapGetters('form', ['multiLanguage']),
    isRtl() {
      if (
        this.multiLanguage === 'ar' ||
        this.multiLanguage === 'fa' ||
        this.multiLanguage === 'pa'
      )
        return true;
      else return false;
    },
  },
};
</script>
<style lang="scss">
.dir-rtl {
  direction: rtl !important;
}
</style>
