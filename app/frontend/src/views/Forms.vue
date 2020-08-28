<template>
  <v-container>
    <h1 class="text-center">My Forms</h1>
    <div class="text-right">
      <strong><a href="">Create a New Form</a></strong>
    </div>
    <FormsTable />
  </v-container>
</template>

<script>
import FormsTable from '@/components/designer/FormsTable.vue';

export default {
  name: 'Forms',
  components: {
    FormsTable,
  },
};
</script>
