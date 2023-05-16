<template>
  <v-skeleton-loader :loading="loading" type="article">
    <FormViewer
      displayTitle
      :readOnly="readOnly"
      :saved="saved"
      :submissionId="submissionId"
      :formId="formId"
      :isDuplicate="true"
    />
  </v-skeleton-loader>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'UserDuplicateSubmission',
  components: {
    FormViewer,
  },
  props: {
    submissionId: String,
    formId: String,
    readOnly: { type: Boolean, default: true },
    saved: {
      type: Boolean,
      default: false,
    },
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
