<script>
import { mapActions, mapState } from 'pinia';
import FormViewer from '~/components/designer/FormViewer.vue';
import { useFormStore } from '~/store/form';
import { NotificationTypes } from '~/utils/constants';
import { useNotificationStore } from '../../../store/notification';

export default {
  components: {
    FormViewer,
  },
  props: {
    submissionId: {
      type: String,
      required: true,
    },
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
  computed: {
    ...mapState(useFormStore, ['formSubmission']),
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
  methods: {
    ...mapActions(useFormStore, ['fetchSubmission']),
    ...mapActions(useNotificationStore, ['addNotification']),
  },
};
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article" class="bgtrans">
    <v-container fluid
      ><FormViewer
        display-title
        :read-only="readOnly"
        :saved="saved"
        :submission-id="submissionId"
      />
    </v-container>
  </v-skeleton-loader>
</template>
