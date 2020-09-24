<template>
  <div>
    <h1 class="my-6 text-center">Team Management</h1>
    <TeamManagement :formId="formId" />
  </div>
</template>

<script>
import TeamManagement from '@/components/forms/TeamManagement.vue';

export default {
  name: 'FormTeams',
  components: {
    TeamManagement
  },
  props: {
    formId: {
      type: String,
      required: true
    }
  }
};
</script>
