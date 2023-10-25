<template>
  <BaseDialog
    type="CONTINUE"
    :isClickOutsideDisabled="true"
    :width="'50%'"
    :value="showTokenExpiredWarningMsg"
    @close-dialog="onClose"
    @continue-dialog="
      () => {
        setTokenExpirationWarningDialog({
          showTokenExpiredWarningMsg: false,
          resetToken: true,
        });
      }
    "
  >
    <template #title
      ><span :lang="lang">{{
        $t('trans.baseWarningDialog.sessionExpiring')
      }}</span></template
    >
    <template #text>
      <div class="text-display-4 d-flex flex-row" :class="{ 'dir-rtl': isRTL }">
        <span :lang="lang">{{
          $t('trans.baseWarningDialog.sessionExpireIn')
        }}</span>
        <span class="ml-2">
          <BaseTime
            @timer-stopped="onClose"
            :action="showTokenExpiredWarningMsg ? 'start' : 'stop'"
          /> </span
        ><span class="mr-2">.</span>
        <span :lang="lang">{{
          $t('trans.baseWarningDialog.signedOutAutomatically')
        }}</span>
      </div>

      <div class="text-display-3 mt-3" :class="{ 'dir-rtl': isRTL }">
        {{ $t('trans.baseWarningDialog.wantStaySignedIn') }}
      </div>
    </template>
    <template #button-text-continue>
      <span :lang="lang" :class="{ 'dir-rtl': isRTL }">{{
        $t('trans.baseWarningDialog.staySignedIn')
      }}</span>
    </template>
    <template #button-text-cancel>
      <span :lang="lang" :class="{ 'dir-rtl': isRTL }">
        {{ $t('trans.baseWarningDialog.logout') }}</span
      >
    </template>
  </BaseDialog>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'BaseWarningDialog',
  computed: {
    ...mapGetters('auth', ['showTokenExpiredWarningMsg']),
    ...mapGetters('form', ['isRTL', 'lang']),
  },
  methods: {
    ...mapActions('auth', ['setTokenExpirationWarningDialog']),
    onClose() {
      this.setTokenExpirationWarningDialog({
        showTokenExpiredWarningMsg: false,
        resetToken: false,
      });
    },
  },
};
</script>
