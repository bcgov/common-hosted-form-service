<template>
  <v-container>
    <router-view v-slot="{ Component }">
      <transition name="component-fade" mode="out-in">
        <component :is="Component"></component>
      </transition>
    </router-view>
  </v-container>
</template>
