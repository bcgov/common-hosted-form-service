<script setup>
import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';
import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import BCGovNavBar from './components/bcgov/BCGovNavBar.vue';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';
</script>

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
