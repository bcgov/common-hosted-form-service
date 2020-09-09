<template>
  <v-container>
    <h1 class="text-center">My Forms</h1>
    <div class="text-right">
      <strong>
        <router-link :to="{ name: 'NewDesigner' }">Create a New Form</router-link>
      </strong>
    </div>
    <FormsTable />
  </v-container>
</template>

<script>
import FormsTable from '@/components/designer/FormsTable.vue';

export default {
  name: 'MyForms',
  components: {
    FormsTable,
  },
};
</script>
