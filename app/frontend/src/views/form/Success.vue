<template>
  <div>
    <FormViewer :submissionId="s" :readOnly="true" displayTitle>
      <template #alert="{ form }">
        <div class="mb-5">
          <h1 class="mb-5">
            <v-icon large color="success">check_circle</v-icon>
            {{ $t('trans.sucess.sucessFormSubmissn') }}
          </h1>
          <div v-if="form.showSubmissionConfirmation">
            <h3>
              <span class="d-print-none">
                {{ $t('trans.sucess.keepRecord') }}
              </span>
              <span>
                {{ $t('trans.sucess.confirmationId') }}:
                <mark>{{ s.substring(0, 8).toUpperCase() }}</mark>
              </span>
            </h3>
            <RequestReceipt
              class="d-print-none"
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
};
</script>
