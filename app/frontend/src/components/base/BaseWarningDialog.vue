<template>
  <BaseDialog
    type="CONTINUE"
    :isClickOutsideDisabled="true"
    :width="'50%'"
    :value="showTokenExpiredWarningMSg"
    @close-dialog="onClose"
    @continue-dialog="
      () => {
        setTokenExpirationWarningDialog({
          showTokenExpiredWarningMSg: false,
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
            :action="showTokenExpiredWarningMSg ? 'start' : 'stop'"
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
import { ref } from 'vue';

export default {
  name: 'BaseWarningDialog',
  data() {
    return {
      action: ref('start'),
      now: Math.trunc(new Date().getTime() / 1000),
    };
  },
  computed: {
    ...mapGetters('auth', ['showTokenExpiredWarningMSg']),
    ...mapGetters('form', ['isRTL', 'lang']),
  },
  methods: {
    ...mapActions('auth', ['setTokenExpirationWarningDialog']),
    onClose() {
      this.setTokenExpirationWarningDialog({
        showTokenExpiredWarningMSg: false,
        resetToken: false,
      });
    },
  },
  beforeRouteLeave(to, from, next) {
    clearInterval(this.showTokenExpiredWarningMSg);
    next();
  },
};
</script>
