<template>
  <BaseSecure>
    <TeamManagement :formId="f" />
  </BaseSecure>
</template>

<script>
import TeamManagement from '@/components/forms/manage/TeamManagement.vue';

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
  }
};
</script>
