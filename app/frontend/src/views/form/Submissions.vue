<template>
  <SubmissionsTable :formId="f" />
</template>

<script>
import SubmissionsTable from '@/components/forms/SubmissionsTable.vue';

export default {
  name: 'Submissions',
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  components: {
    SubmissionsTable,
  },
};
</script>
