<template>
  <div>
    <FormViewer :submission-id="s" :read-only="true" display-title>
      <template #alert="{ form }">
        <div class="mb-5">
          <h1 class="mb-5">
            <v-icon size="large" color="success">check_circle</v-icon>
            Your form has been submitted successfully
          </h1>
          <div v-if="form.showSubmissionConfirmation">
            <h3>
              <span class="d-print-none">
                If you wish to keep a record of this submission, you can keep
                the following
              </span>
              <span>
                Confirmation ID:
                <mark>{{ s.substring(0, 8).toUpperCase() }}</mark>
              </span>
            </h3>
            <RequestReceipt
              class="d-print-none"
              :email="email"
              :form-name="form.name"
              :submission-id="s"
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

import FormViewer from '@src/components/designer/FormViewer.vue';
import RequestReceipt from '@src/components/forms/RequestReceipt.vue';

export default {
  name: 'FormView',
  components: {
    FormViewer,
    RequestReceipt,
  },
  props: {
    s: String,
  },
  computed: mapGetters('auth', ['email']),
};
</script>
