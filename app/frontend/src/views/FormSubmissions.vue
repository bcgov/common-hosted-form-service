<template>
  <v-container>
    <h1 class="my-6 text-center">Submissions</h1>
    <SubmissionsTable :formId="formId" :versionId="versionId"/>
  </v-container>
</template>

<script>
import SubmissionsTable from '@/components/forms/SubmissionsTable.vue';

export default {
  name: 'FormSubmissions',
  props: ['formId', 'versionId'],
  components: {
    SubmissionsTable,
  }
};
</script>
