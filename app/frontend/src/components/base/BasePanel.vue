<template>
  <v-card variant="outlined" flat>
    <v-card-title v-if="$slots.title">
      <slot name="title" />
    </v-card-title>
    <v-card-text>
      <slot />
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.v-card {
  border-radius: 0.5em;
  .v-card-title {
    background-color: #efefef;
    border-bottom: 1px solid lightgray;
    font-weight: 800;
    padding: 0.5em 1em;
  }
  .v-card-text {
    padding: 1.5em;
  }
}

.v-card--variant-outlined {
  border: thin solid rgba(0, 0, 0, 0.12) !important;
}
</style>
