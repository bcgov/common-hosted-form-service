<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import FormViewer from '~/components/designer/FormViewer.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

const properties = defineProps({
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
});

const loading = ref(true);

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { formSubmission } = storeToRefs(formStore);

onMounted(async () => {
  await formStore.fetchSubmission({ submissionId: properties.submissionId });
  // check if we are on a Draft page but the submission is already submitted, we'll redirect user
  if (
    properties.draft &&
    !formSubmission.value?.draft &&
    formSubmission.value?.submission?.state === 'submitted'
  ) {
    router.push({
      name: 'UserFormView',
      query: {
        s: formSubmission.value?.id,
      },
    });

    notificationStore.addNotification({
      ...NotificationTypes.WARNING,
      text: t('trans.formViewer.formDraftAccessErrMsg'),
    });
  }
  loading.value = false;
});
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
