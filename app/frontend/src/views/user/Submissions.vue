<template>
  <div>
    <MySubmissionsTable :formId="f" />
  </div>
</template>

<script>
import MySubmissionsTable from '@/components/forms/submission/MySubmissionsTable.vue';

export default {
  name: 'Submissions',
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  components: {
    MySubmissionsTable,
  },
};
</script>
