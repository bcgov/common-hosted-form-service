<template>
  <div>
    <v-btn color="primary" text small @click="displayDialog">
      <v-icon class="mr-1">email</v-icon>
      <span>Email a receipt of this submission</span>
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
            v-model="to"
            dense
            flat
            solid
            outlined
            label="Send to E-mail Address"
            :rules="emailRules"
            data-test="text-form-to"
          />
        </v-form>
      </template>
      <template #button-text-continue>
        <span>SEND</span>
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
  data: () => ({
    emailRules: [(v) => !!v || 'E-mail is required'],
    showDialog: false,
    to: '',
    valid: false,
  }),
  mounted() {
    this.resetDialog();
  },
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
            message: `An email has been sent to ${this.to}.`,
            ...NotificationTypes.SUCCESS,
          });
        } catch (error) {
          this.addNotification({
            message: 'An error occured while attempting to send your email.',
            consoleError: `Email confirmation to ${this.to} failed: ${error}`,
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
};
</script>
