<template>
  <v-footer :class="{ 'gov-footer': true, 'd-print-none': formSubmitMode }">
    <v-btn text id="footer-home" href="https://www.gov.bc.ca/">
      <span>{{ $t('trans.bCGovFooter.home') }}</span>
    </v-btn>
    <v-btn
      text
      id="footer-about"
      href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca"
    >
      <span>{{ $t('trans.bCGovFooter.about') }}</span>
    </v-btn>

    <v-btn text id="footer-disclaimer" href="http://gov.bc.ca/disclaimer">
      <span>{{ $t('trans.bCGovFooter.disclaimer') }}</span>
    </v-btn>
    <v-btn text id="footer-privacy" href="http://gov.bc.ca/privacy">
      <span>{{ $t('trans.bCGovFooter.privacy') }}</span>
    </v-btn>
    <v-btn
      text
      id="footer-accessibility"
      href="http://gov.bc.ca/webaccessibility"
    >
      <span>{{ $t('trans.bCGovFooter.accessibility') }}</span>
    </v-btn>
    <v-btn text id="footer-copyright" href="http://gov.bc.ca/copyright">
      <span>{{ $t('trans.bCGovFooter.copyRight') }}</span>
    </v-btn>
    <v-btn
      text
      id="footer-contact"
      href="https://www2.gov.bc.ca/gov/content/home/contact-us"
    >
      <span>{{ $t('trans.bCGovFooter.contactUs') }}</span>
    </v-btn>
  </v-footer>
</template>

<script>
export default {
  name: 'BCGovFooter',
  computed: {
    formSubmitMode() {
      // don't include footer when printing form submitting pages
      return this.$route && this.$route.meta && this.$route.meta.formSubmitMode;
    },
  },
};
</script>

<style lang="scss" scoped>
.gov-footer {
  background-color: #003366 !important;
  border-top: 2px solid #fcba19;
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
