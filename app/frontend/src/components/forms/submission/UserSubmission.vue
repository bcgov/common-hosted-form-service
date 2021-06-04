<template>
  <v-skeleton-loader :loading="loading" type="article">
    <FormViewer displayTitle readOnly :submissionId="submissionId" />
  </v-skeleton-loader>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'UserSubmission',
  components: {
    FormViewer,
  },
  props: {
    submissionId: String,
  },
  data() {
    return {
      loading: true,
    };
  },
  computed: mapGetters('form', ['formSubmission']),
  methods: mapActions('form', ['fetchSubmission']),
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    this.loading = false;
  },
};
</script>
