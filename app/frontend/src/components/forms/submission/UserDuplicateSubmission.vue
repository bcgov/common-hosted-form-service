<script>
import { mapActions } from 'pinia';
import FormViewer from '~/components/designer/FormViewer.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    FormViewer,
  },
  props: {
    submissionId: {
      type: String,
      required: true,
    },
    formId: {
      type: String,
      required: true,
    },
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
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    this.loading = false;
  },
  methods: {
    ...mapActions(useFormStore, ['fetchSubmission']),
  },
};
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article" class="bgtrans">
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
