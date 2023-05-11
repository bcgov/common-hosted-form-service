<template>
  <div>
    <slot />
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'BaseStepper',
  model: {
    prop: 'creatorStep',
    event: 'change',
  },
  props: {
    value: String,
    creatorStep: {
      type: Number,
    },
  },
  provide() {
    return {
      creatorStep: computed(() => this.creatorStep),
    };
  },
};
</script>
