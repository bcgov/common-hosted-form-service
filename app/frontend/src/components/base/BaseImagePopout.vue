<template>
  <div>
    <v-hover>
      <template v-slot:default="{ hover }">
        <v-img
          :class="`elevation-${hover ? 24 : 6}`"
          class="thumbnail"
          :alt="alt"
          contain
          :src="src"
          :width="width"
          @click="dialog = true"
        />
      </template>
    </v-hover>

    <v-dialog v-model="dialog" width="unset">
      <v-card><v-img :alt="alt" :src="src" /></v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
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
    },
  },
  data() {
    return {
      dialog: false,
    };
  },
};
</script>

<style lang="scss" scoped>
.thumbnail:hover {
  cursor: pointer;
}
</style>
