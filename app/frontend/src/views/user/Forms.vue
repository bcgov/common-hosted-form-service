<template>
  <div>
    <h1 class="my-6 text-center">My Forms</h1>
    <FormsTable />
  </div>
</template>

<script>
import FormsTable from '@/components/designer/FormsTable.vue';

export default {
  name: 'UserForms',
  components: {
    FormsTable,
  },
};
</script>
