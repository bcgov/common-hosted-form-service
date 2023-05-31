<template>
  <div>
    <v-btn color="primary" text small @click="displayDialog">
      <v-icon class="mr-1">email</v-icon>
      <span>{{ $t('trans.requestReceipt.emailReceipt') }}</span>
    </v-btn>

    <BaseDialog
      v-model="showDialog"
      type="CONTINUE"
      @close-dialog="showDialog = false"
      @continue-dialog="requestReceipt()"
    >
      <template #icon>
        <v-icon large color="primary" class="d-none d-sm-flex"> email </v-icon>
      </template>
      <template #text>
        <v-form
          ref="form"
          v-model="valid"
          @submit="requestReceipt()"
          @submit.prevent
        >
          <v-text-field
            dense
            flat
            solid
            outlined
            :label="$t('trans.requestReceipt.sendToEmailAddress')"
            :rules="emailRules"
            v-model="to"
            data-test="text-form-to"
          />
        </v-form>
      </template>
      <template v-slot:button-text-continue>
        <span>{{ $t('trans.requestReceipt.send') }}</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

import { NotificationTypes } from '@/utils/constants';
import { formService } from '@/services';

export default {
  name: 'RequestReceipt',
  data: () => ({
    emailRules: [(v) => !!v || this.$t('trans.requestReceipt.emailRequired')],
    showDialog: false,
    to: '',
    valid: false,
  }),
  methods: {
    ...mapActions('notifications', ['addNotification']),
    displayDialog() {
      this.showDialog = true;
    },
    async requestReceipt() {
      if (this.valid) {
        try {
          await formService.requestReceiptEmail(this.submissionId, {
            to: this.to,
          });
          this.addNotification({
            message: this.$t('trans.requestReceipt.emailSent', { to: this.to }),
            ...NotificationTypes.SUCCESS,
          });
        } catch (error) {
          this.addNotification({
            message: this.$t('trans.requestReceipt.sendingEmailErrMsg'),
            consoleError: this.$t(
              'trans.requestReceipt.sendingEmailConsErrMsg',
              { to: this.to, error: error }
            ),
          });
        } finally {
          this.showDialog = false;
        }
      }
    },
    resetDialog() {
      this.to = this.email;
      this.valid = false;
    },
  },
  mounted() {
    this.resetDialog();
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
};
</script>
