<template>
  <TeamManagement :formId="formId" />
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
