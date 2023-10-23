<template>
  <BaseDialog
    type="INFO"
    :isClickOutsideDisabled="true"
    :width="'50%'"
    :showCloseButton="true"
    :value="firstTimeUserLogin"
    :buttonAlignment="'justify-end'"
    @close-dialog="onClose"
    @continue-dialog="
      () => {
        this.$router.push({
          name: 'FormCreate',
        });
        this.onClose();
      }
    "
  >
    <template #title> </template>
    <template #text>
      <div class="text-display-4 text-center" :class="{ 'dir-rtl': isRTL }">
        <p :lang="lang" class="hs">
          {{ $t('trans.firstTimeUserInfoBanner.welcome') }}
        </p>
        <div :lang="lang" class="hs1">
          {{ $t('trans.firstTimeUserInfoBanner.createCHFS') }}
        </div>
      </div>

      <h2 id="video" class="pt-5 hs2" :lang="lang">
        {{ $t('trans.firstTimeUserInfoBanner.takeATourOfChefs') }}
      </h2>
      <div class="video-wrapper">
        <iframe
          width="100%"
          height="300px !important"
          :src="chefsTourVideoUrl"
          :title="$t('trans.firstTimeUserInfoBanner.introductionToCHEFS')"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        >
        </iframe>
      </div>
    </template>
    <template #button-text-delete>
      <span :lang="lang" :class="{ 'dir-rtl': isRTL }" class="btn1">
        {{ $t('trans.firstTimeUserInfoBanner.skipWalkThrough') }}</span
      >
    </template>
    <template #button-text-continue>
      <span :lang="lang" :class="{ 'dir-rtl': isRTL }" class="btn2"
        >{{ $t('trans.firstTimeUserInfoBanner.createYourFirstForm') }}
      </span>
    </template>
  </BaseDialog>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
export default {
  name: 'FirstTimeUserInfoBanner',
  computed: {
    ...mapGetters('form', ['isRTL', 'lang', 'firstTimeUserLogin']),
    chefsTourVideoUrl() {
      return process.env.VUE_APP_CHEFSTOURURL;
    },
  },
  methods: {
    ...mapActions('form', ['setFirstTimeUserLogin']),
    onClose() {
      this.setFirstTimeUserLogin(false);
    },
  },
};
</script>
<style lang="css">
.hs {
  color: #181818;
  text-align: center;
  font-family: BCSans !important;
  font-size: 1.9em;
  font-style: normal;
  font-weight: 700;
  line-height: 31.92px;
}

.hs1 {
  color: #181818;
  text-align: center;
  font-family: BCSans !important;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
}

.hs2 {
  color: #000;

  text-align: center;
  /* submit_digital_gov_bc_ca_app_user_forms_2132x1066.2857666015625_default/BC Sans/Regular 14 */
  font-family: BCSans !important;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 19.6px;
}

.btn1 {
  color: #003366;
  text-align: center;
  font-family: BCSans !important;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 1.25px;
  text-transform: uppercase;
}

btn2 {
  color: #ffffff;
  text-align: center;
  font-family: BCSans !important;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 1.25px;
  text-transform: uppercase;
}
</style>
