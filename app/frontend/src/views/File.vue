<template>
  <v-container>
    <transition name="component-fade" mode="out-in">
      <router-view />
    </transition>
  </v-container>
</template>

<script>
export default {
  name: 'File',
};
</script>
