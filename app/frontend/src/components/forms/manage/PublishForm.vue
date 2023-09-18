<template>
  <v-container class="text-center">
    <ManageVersions />
  </v-container>
</template>

<script>
import ManageVersions from '@/components/forms/manage/ManageVersions.vue';
export default {
  name: 'PublishForm',
  components: {
    ManageVersions,
  },
};
</script>
