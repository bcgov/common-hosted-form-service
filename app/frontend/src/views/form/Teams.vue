<template>
  <div>
    <v-breadcrumbs :items="breadcrumbs" />
    <h1 class="my-6 text-center">Team Management</h1>
    <TeamManagement :formId="f" />
  </div>
</template>

<script>
import TeamManagement from '@/components/forms/TeamManagement.vue';

export default {
  name: 'FormTeams',
  components: {
    TeamManagement,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  computed: {
    breadcrumbs() {
      const path = [
        {
          text: 'Form',
        },
        {
          text: 'Manage Form'
        }
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
