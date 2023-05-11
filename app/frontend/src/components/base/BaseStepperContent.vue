<template>
  <div v-show="step === creatorStep">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'BaseStepperContent',
  inject: ['creatorStep'],
  props: {
    step: {
      type: Number,
    },
  },
};
</script>
