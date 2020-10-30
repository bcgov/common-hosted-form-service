<template>
  <div>
    <FormViewer :submissionId="s">
      <template #alert="{ form }">
        <div class="mb-5">
          <h1 class="mb-5">
            <v-icon large color="success">check_circle</v-icon>
            Your form has been submitted successfully
          </h1>
          <h3 v-if="form.showSubmissionConfirmation">
            If you wish to keep a record of this submission, you can keep the
            following Confirmation ID:
            <mark>{{ s.substring(0, 8).toUpperCase() }}</mark>
          </h3>
          <RequestReceipt
            :email="email"
            :formName="form.name"
            :submissionId="s"
          />
          <hr />
        </div>
      </template>
    </FormViewer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import FormViewer from '@/components/designer/FormViewer.vue';
import RequestReceipt from '@/components/forms/RequestReceipt.vue';

export default {
  name: 'FormView',
  props: {
    s: String,
  },
  components: {
    FormViewer,
    RequestReceipt,
  },
  computed: mapGetters('auth', ['email'])
};
</script>
