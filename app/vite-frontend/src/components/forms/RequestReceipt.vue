<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  email: {
    type: String,
    required: true,
  },
  formName: {
    type: String,
    required: true,
  },
  submissionId: {
    type: String,
    required: true,
  },
});

const emailRules = ref([(v) => !!v || 'E-mail is required']);
const form = ref(null);
const showDialog = ref(false);
const to = ref('');

onMounted(() => {
  resetDialog();
});

function displayDialog() {
  showDialog.value = true;
}
async function requestReceipt() {
  const { valid } = await form.value.validate();
  if (valid) {
    const notificationStore = useNotificationStore();
    try {
      await formService.requestReceiptEmail(properties.submissionId, {
        to: to.value,
      });
      notificationStore.addNotification({
        text: t('trans.requestReceipt.emailSent', { to: to.value }),
        ...NotificationTypes.SUCCESS,
      });
    } catch (error) {
      notificationStore.addNotification({
        text: t('trans.requestReceipt.sendingEmailErrMsg'),
        consoleError: t('trans.requestReceipt.sendingEmailConsErrMsg', {
          to: to.value,
          error: error,
        }),
      });
    } finally {
      showDialog.value = false;
    }
  }
}
function resetDialog() {
  to.value = properties.email;
}
</script>

<template>
  <div>
    <v-btn color="primary" variant="text" size="small" @click="displayDialog">
      <v-icon icon="mdi:mdi-email"></v-icon>
      <span>{{ $t('trans.requestReceipt.emailReceipt') }}</span>
    </v-btn>

    <BaseDialog
      v-model="showDialog"
      type="CONTINUE"
      @close-dialog="showDialog = false"
      @continue-dialog="requestReceipt()"
    >
      <template #text>
        <v-form ref="form" @submit="requestReceipt()" @submit.prevent>
          <v-text-field
            v-model="to"
            density="compact"
            solid
            variant="outlined"
            :label="$t('trans.requestReceipt.sendToEmailAddress')"
            :rules="emailRules"
            data-test="text-form-to"
          >
            <template #prepend>
              <v-icon
                color="primary"
                class="d-none d-sm-flex"
                icon="mdi:mdi-email"
              ></v-icon>
            </template>
          </v-text-field>
        </v-form>
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.requestReceipt.send') }}</span>
      </template>
    </BaseDialog>
  </div>
</template>
