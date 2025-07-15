<template>
  <v-container>
    <RouterView v-slot="{ Component }">
      <transition name="component-fade" mode="out-in">
        <component :is="Component" class="main" />
      </transition>
    </RouterView>
  </v-container>
</template>
