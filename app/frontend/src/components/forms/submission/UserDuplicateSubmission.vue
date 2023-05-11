<template>
  <v-skeleton-loader :loading="loading" type="article">
    <FormViewer
      display-title
      :read-only="readOnly"
      :saved="saved"
      :submission-id="submissionId"
      :form-id="formId"
      :is-duplicate="true"
    />
  </v-skeleton-loader>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormViewer from '@src/components/designer/FormViewer.vue';

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
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    this.loading = false;
  },
  methods: mapActions('form', ['fetchSubmission']),
};
</script>
