<script setup>
import { ref } from 'vue';

defineProps({
  alt: {
    type: String,
    default: '',
  },
  src: {
    type: String,
    required: true,
  },
  width: {
    type: String,
    default: '600px',
  },
});

const dialog = ref(false);
</script>

<template>
  <div>
    <v-hover>
      <template #default="{ isHovering, props }">
        <v-img
          v-bind="props"
          :class="`elevation-${isHovering ? 24 : 6}`"
          class="thumbnail"
          :alt="alt"
          cover
          :src="src"
          :width="width"
          @click="dialog = true"
        />
      </template>
    </v-hover>

    <v-dialog v-model="dialog" width="100vh">
      <v-card><v-img :alt="alt" :src="src" /></v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
.thumbnail:hover {
  cursor: pointer;
}
</style>
