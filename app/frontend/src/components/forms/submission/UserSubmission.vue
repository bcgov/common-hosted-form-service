<template>
  <v-skeleton-loader :loading="loading" type="article">
    <FormViewer
      displayTitle
      :readOnly="readOnly"
      :saved="saved"
      :submissionId="submissionId"
    />
  </v-skeleton-loader>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import FormViewer from '@/components/designer/FormViewer.vue';
import { NotificationTypes } from '@/utils/constants';

export default {
  name: 'UserSubmission',
  components: {
    FormViewer,
  },
  props: {
    submissionId: String,
    readOnly: { type: Boolean, default: true },
    saved: {
      type: Boolean,
      default: false,
    },
    draft: {
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
  methods: {
    ...mapActions('form', ['fetchSubmission']),
    ...mapActions('notifications', ['addNotification']),
  },
  async mounted() {
    await this.fetchSubmission({ submissionId: this.submissionId });
    // check if we are on a Draft page but the submission is already submitted, we'll redirect user
    if (
      this.draft &&
      !this.formSubmission?.draft &&
      this.formSubmission?.submission?.state === 'submitted'
    ) {
      this.$router.push({
        name: 'UserFormView',
        query: {
          s: this.formSubmission?.id,
        },
      });
      this.addNotification({
        ...NotificationTypes.WARNING,
        message: this.$t('trans.formViewer.formDraftAccessErrMsg'),
      });
    }
    this.loading = false;
  },
};
</script>
