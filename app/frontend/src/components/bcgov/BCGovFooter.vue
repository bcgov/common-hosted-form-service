<template>
  <v-footer :class="{ 'gov-footer': true, 'd-print-none': formSubmitMode }">
    <v-row no-gutters>
      <v-btn id="footer-home" variant="text" href="https://www.gov.bc.ca/">
        <span>Home</span>
      </v-btn>
      <v-btn
        id="footer-about"
        variant="text"
        href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca"
      >
        <span>About gov.bc.ca</span>
      </v-btn>
      <v-btn
        id="footer-disclaimer"
        variant="text"
        href="http://gov.bc.ca/disclaimer"
      >
        <span>Disclaimer</span>
      </v-btn>
      <v-btn id="footer-privacy" variant="text" href="http://gov.bc.ca/privacy">
        <span>Privacy</span>
      </v-btn>
      <v-btn
        id="footer-accessibility"
        variant="text"
        href="http://gov.bc.ca/webaccessibility"
      >
        <span>Accessibility</span>
      </v-btn>
      <v-btn
        id="footer-copyright"
        variant="text"
        href="http://gov.bc.ca/copyright"
      >
        <span>Copyright</span>
      </v-btn>
      <v-btn
        id="footer-contact"
        variant="text"
        href="https://www2.gov.bc.ca/gov/content/home/contact-us"
      >
        <span>Contact Us</span>
      </v-btn>
    </v-row>
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
