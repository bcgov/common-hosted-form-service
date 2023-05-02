<template>
  <div>
    <MySubmissionsTable :form-id="f" />
  </div>
</template>

<script>
import MySubmissionsTable from '@/components/forms/submission/MySubmissionsTable.vue';

export default {
  name: 'Submissions',
  components: {
    MySubmissionsTable,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
};
</script>
