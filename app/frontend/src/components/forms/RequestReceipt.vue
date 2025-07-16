<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { formService, rbacService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  email: {
    type: String,
    required: true,
  },
  submissionId: {
    type: String,
    required: true,
  },
});

const emailRules = ref([(v) => !!v || 'E-mail is required']);
const forms = ref(null);
const priority = ref('normal');
const showDialog = ref(false);
const to = ref('');
const formStore = useFormStore();

const { isRTL, form } = storeToRefs(useFormStore());

onMounted(() => {
  resetDialog();
  formStore.fetchSubmission({ submissionId: properties.submissionId });
});

function displayDialog() {
  showDialog.value = true;
}

async function requestReceipt() {
  const { valid } = await forms.value.validate();
  if (valid) {
    const notificationStore = useNotificationStore();
    try {
      if (form.value.enableTeamMemberDraftShare) {
        const formUsersResponse = await rbacService.isUserAssignedToFormTeams({
          formId: form.value.id,
          email: to.value,
          roles: '*',
        });

        if (formUsersResponse && !formUsersResponse.data) {
          notificationStore.addNotification({
            ...NotificationTypes.ERROR,
            text: t('trans.canShareDraft.canShareMessage'),
          });
          return;
        }
      }
      await formService.requestReceiptEmail(properties.submissionId, {
        priority: priority.value,
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

defineExpose({ displayDialog, forms, showDialog });
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-btn
      color="primary"
      variant="text"
      size="small"
      :class="{ 'dir-rtl': isRTL }"
      :title="$t('trans.requestReceipt.emailReceipt')"
      @click="displayDialog"
    >
      <v-icon icon="mdi:mdi-email"></v-icon>
      <span :lang="locale">{{ $t('trans.requestReceipt.emailReceipt') }}</span>
    </v-btn>

    <BaseDialog
      v-model="showDialog"
      type="CONTINUE"
      :class="{ 'dir-rtl': isRTL }"
      @close-dialog="showDialog = false"
      @continue-dialog="requestReceipt()"
    >
      <template #text>
        <v-form ref="forms" @submit="requestReceipt()" @submit.prevent>
          <v-text-field
            v-model="to"
            density="compact"
            solid
            variant="outlined"
            :label="$t('trans.requestReceipt.sendToEmailAddress')"
            :rules="emailRules"
            data-test="text-form-to"
            :lang="locale"
          >
            <template #prepend>
              <v-icon
                color="primary"
                class="d-none d-sm-flex"
                icon="mdi:mdi-email"
              ></v-icon>
            </template>
          </v-text-field>
          <v-select
            v-model="priority"
            density="compact"
            variant="outlined"
            :items="[
              { title: $t('trans.requestReceipt.low'), value: 'low' },
              { title: $t('trans.requestReceipt.normal'), value: 'normal' },
              { title: $t('trans.requestReceipt.high'), value: 'high' },
            ]"
            :label="$t('trans.requestReceipt.emailPriority')"
            :lang="locale"
          >
            <template #prepend>
              <v-icon />
            </template>
          </v-select>
        </v-form>
      </template>
      <template #button-text-continue>
        <span :lang="locale">{{ $t('trans.requestReceipt.send') }}</span>
      </template>
    </BaseDialog>
  </div>
</template>
