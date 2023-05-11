<template>
  <v-row align="center" class="spacer">
    <v-col cols="2" sm="2" md="1">
      <v-avatar
        v-if="complete"
        :color="complete ? 'primary' : 'grey'"
        size="x-small"
        icon="check"
      >
      </v-avatar>
      <v-avatar
        v-else
        class="text-end"
        :color="complete ? 'primary' : 'grey'"
        size="x-small"
      >
        {{ step }}
      </v-avatar>
    </v-col>
    <v-col style="margin-left: 10px">
      <div v-if="complete" style="color: black">
        <slot />
      </div>
      <div v-else style="color: grey">
        <slot />
      </div>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'BaseStepperStep',
  props: {
    step: {
      type: Number,
      default: 1,
    },
    complete: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.v-row {
  flex: none;
}
</style>
