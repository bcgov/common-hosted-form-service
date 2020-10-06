<template>
  <div>
    <v-breadcrumbs :items="breadcrumbs" />
    <h1 class="my-6 text-center">Your Submission History (TBD)</h1>
  </div>
</template>

<script>
export default {
  name: 'UserHistory',
  computed: {
    breadcrumbs() {
      const path = [
        {
          text: 'User',
        },
      ];
      if (this.$route.meta.breadcrumbTitle) {
        path.push({
          text: this.$route.meta.breadcrumbTitle,
        });
      }
      return path;
    },
  },
};
</script>
