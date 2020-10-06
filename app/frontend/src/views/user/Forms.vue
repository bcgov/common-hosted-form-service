<template>
  <div>
    <h1 class="my-6 text-center">My Forms</h1>
    <div class="text-right">
      <strong>
        <router-link :to="{ name: 'FormDesigner' }">Create a New Form</router-link>
      </strong>
    </div>
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
