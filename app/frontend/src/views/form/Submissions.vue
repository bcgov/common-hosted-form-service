<template>
  <div>
    <h1 class="my-6 text-center">Submissions</h1>
    <SubmissionsTable :formId="formId"/>
  </div>
</template>

<script>
import SubmissionsTable from '@/components/forms/SubmissionsTable.vue';

export default {
  name: 'Submissions',
  props: ['formId'],
  components: {
    SubmissionsTable,
  }
};
</script>
