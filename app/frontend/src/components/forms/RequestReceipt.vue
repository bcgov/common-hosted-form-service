<script>
import { mapState } from 'pinia';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { i18n } from '~/internationalization';
import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

export default {
  components: {
    BaseDialog,
  },
  props: {
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
  },
  data() {
    return {
      emailRules: [(v) => !!v || 'E-mail is required'],
      priority: 'normal',
      showDialog: false,
      to: '',
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
  mounted() {
    this.resetDialog();
  },
  methods: {
    displayDialog() {
      this.showDialog = true;
    },
    async requestReceipt() {
      const { valid } = await this.$refs.form.validate();
      if (valid) {
        const notificationStore = useNotificationStore();
        try {
          await formService.requestReceiptEmail(this.submissionId, {
            priority: this.priority,
            to: this.to,
          });
          notificationStore.addNotification({
            text: i18n.t('trans.requestReceipt.emailSent', { to: this.to }),
            ...NotificationTypes.SUCCESS,
          });
        } catch (error) {
          notificationStore.addNotification({
            text: i18n.t('trans.requestReceipt.sendingEmailErrMsg'),
            consoleError: i18n.t(
              'trans.requestReceipt.sendingEmailConsErrMsg',
              {
                to: this.to,
                error: error,
              }
            ),
          });
        } finally {
          this.showDialog = false;
        }
      }
    },
    resetDialog() {
      this.to = this.email;
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-btn
      color="primary"
      variant="text"
      size="small"
      :class="{ 'dir-rtl': isRTL }"
      @click="displayDialog"
    >
      <v-icon icon="mdi:mdi-email"></v-icon>
      <span :lang="lang">{{ $t('trans.requestReceipt.emailReceipt') }}</span>
    </v-btn>

    <BaseDialog
      v-model="showDialog"
      type="CONTINUE"
      :class="{ 'dir-rtl': isRTL }"
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
            :lang="lang"
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
            :lang="lang"
          >
            <template #prepend>
              <v-icon />
            </template>
          </v-select>
        </v-form>
      </template>
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.requestReceipt.send') }}</span>
      </template>
    </BaseDialog>
  </div>
</template>
