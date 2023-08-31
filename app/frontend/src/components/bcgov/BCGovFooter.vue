<script>
import { mapState } from 'pinia';

import { useFormStore } from '~/store/form';

export default {
  computed: {
    ...mapState(useFormStore, ['lang']),
    formSubmitMode() {
      // don't include footer when printing form submitting pages
      return this.$route && this.$route.meta && this.$route.meta.formSubmitMode;
    },
  },
};
</script>

<template>
  <v-footer
    :class="{
      'elevation-20': true,
      'gov-footer': true,
      'd-print-none': formSubmitMode,
    }"
    absolute
  >
    <v-row no-gutters>
      <v-btn id="footer-home" variant="text" href="https://www.gov.bc.ca/">
        <span :lang="lang">{{ $t('trans.bCGovFooter.home') }}</span>
      </v-btn>
      <v-btn
        id="footer-about"
        variant="text"
        href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca"
      >
        <span :lang="lang">{{ $t('trans.bCGovFooter.about') }}</span>
      </v-btn>
      <v-btn
        id="footer-disclaimer"
        variant="text"
        href="http://gov.bc.ca/disclaimer"
      >
        <span :lang="lang">{{ $t('trans.bCGovFooter.disclaimer') }}</span>
      </v-btn>
      <v-btn id="footer-privacy" variant="text" href="http://gov.bc.ca/privacy">
        <span>{{ $t('trans.bCGovFooter.privacy') }}</span>
      </v-btn>
      <v-btn
        id="footer-accessibility"
        variant="text"
        href="http://gov.bc.ca/webaccessibility"
      >
        <span :lang="lang">{{ $t('trans.bCGovFooter.accessibility') }}</span>
      </v-btn>
      <v-btn
        id="footer-copyright"
        variant="text"
        href="http://gov.bc.ca/copyright"
      >
        <span :lang="lang">{{ $t('trans.bCGovFooter.copyRight') }}</span>
      </v-btn>
      <v-btn
        id="footer-contact"
        variant="text"
        href="https://www2.gov.bc.ca/gov/content/home/contact-us"
      >
        <span :lang="lang">{{ $t('trans.bCGovFooter.contactUs') }}</span>
      </v-btn>
    </v-row>
  </v-footer>
</template>

<style lang="scss" scoped>
.gov-footer {
  background-color: #003366 !important;
  border-top: 2px solid #fcba19;
  flex: none;
  flex-shrink: 0;
  min-height: 2.5rem;
  min-width: 100%;
  padding-bottom: 0;
  padding-top: 0;

  a {
    color: #ffffff;
    font-size: 1rem;
    &:focus {
      outline: none;
    }
  }

  .v-btn__content > span {
    color: #ffffff;
    font-size: 1rem;
    font-weight: normal;
    text-decoration: none;
    text-transform: none;
  }
}
</style>
