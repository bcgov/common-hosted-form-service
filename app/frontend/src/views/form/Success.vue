<template>
  <div>
    <FormViewer :submissionId="s" :readOnly="true" displayTitle>
      <template #alert="{ form }">
        <div class="mb-5">
          <h1 class="mb-5">
            <v-icon large color="success">check_circle</v-icon>
            Your form has been submitted successfully
          </h1>
          <div v-if="form.showSubmissionConfirmation">
            <h3>
              If you wish to keep a record of this submission, you can keep the
              following Confirmation ID:
              <mark>{{ s.substring(0, 8).toUpperCase() }}</mark>
            </h3>
            <RequestReceipt
              :email="email"
              :formName="form.name"
              :submissionId="s"
            />
          </div>
          <hr />
        </div>
      </template>
    </FormViewer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import { determineFormNeedsAuth } from '@/utils/permissionUtils';
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
  computed: mapGetters('auth', ['email']),
  beforeRouteEnter(to, from, next) {
    determineFormNeedsAuth(undefined, to.query.s, next);
  },
};
</script>
