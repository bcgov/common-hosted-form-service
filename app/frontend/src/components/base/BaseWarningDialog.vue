<template>
  <BaseDialog
    type="CONTINUE"
    :showCloseButton="true"
    :width="'50%'"
    :value="showTokenExpiredWarningMSg"
    @close-dialog="
      () => {
        setTokenExpirationWarningDialog({
          showTokenExpiredWarningMSg: false,
          resetToken: false,
        });
      }
    "
    @continue-dialog="
      () => {
        setTokenExpirationWarningDialog({
          showTokenExpiredWarningMSg: false,
          resetToken: true,
        });
      }
    "
  >
    <template #title><span>Session expiring</span></template>
    <template #text>
      <div class="text-display-4">
        Your session will expire soon and you will be signed out automatically.
      </div>
      <div class="text-display-3 mt-3">Do you want to stay signed in?</div>
    </template>
    <template #button-text-continue>
      <span>Confirm</span>
    </template>
  </BaseDialog>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'BaseWarningDialog',
  computed: {
    ...mapGetters('auth', ['showTokenExpiredWarningMSg']),
  },
  methods: {
    ...mapActions('auth', ['setTokenExpirationWarningDialog']),
  },
};
</script>
