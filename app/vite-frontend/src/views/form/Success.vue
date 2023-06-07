<script setup>
import { storeToRefs } from 'pinia';

import FormViewer from '~/components/designer/FormViewer.vue';
import RequestReceipt from '~/components/forms/RequestReceipt.vue';
import { useAuthStore } from '~/store/auth';

defineProps({
  s: {
    type: String,
    required: true,
  },
});

const authStore = useAuthStore();

const { email } = storeToRefs(authStore);
</script>

<template>
  <div>
    <FormViewer :submission-id="s" :read-only="true" display-title>
      <template #alert="{ form }">
        <div class="mb-5">
          <h1 class="mb-5">
            <v-icon
              size="large"
              color="success"
              icon="mdi:mdi-check-circle"
            ></v-icon>
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
