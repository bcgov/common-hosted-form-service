<template>
  <header :class="{'gov-header': true, 'd-print-none': formSubmitMode}">
    <v-toolbar color="#003366" flat class="px-md-12">
      <!-- Navbar content -->
      <a href="https://www2.gov.bc.ca" data-test="btn-header-logo">
        <v-img
          alt="B.C. Government Logo"
          class="d-flex"
          contain
          height="3.5rem"
          src="@/assets/images/bc_logo.svg"
          width="10rem"
        />
      </a>
      <h1 v-if="!formSubmitMode" data-test="btn-header-title" class="font-weight-bold title d-none d-md-flex pl-4">
        {{ appTitle }}
      </h1>
      <v-chip v-if="!formSubmitMode" class="d-none d-md-flex ma-2" color="secondary" text-color="white">Beta</v-chip>
      <v-spacer />
      <BaseAuthButton />
    </v-toolbar>
  </header>
</template>

<script>
export default {
  name: 'BCGovHeader',
  computed: {
    appTitle() {
      return this.$route && this.$route.meta && this.$route.meta.title
        ? this.$route.meta.title
        : process.env.VUE_APP_TITLE;
    },
    formSubmitMode() {
      // hide header content on form submitter pages
      return this.$route && this.$route.meta && this.$route.meta.formSubmitMode;
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/style.scss';

.gov-header {
  border-bottom: 2px solid #fcba19;
  .title {
    font-family: inherit !important;
    color: #ffffff;
    overflow: hidden;
    margin-bottom: 0;
    @media #{map-get($display-breakpoints, 'sm-and-down')} {
      font-size: 1rem !important;
    }
  }
}
</style>
