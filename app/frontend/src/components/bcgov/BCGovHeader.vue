<script>
import BCLogo from '~/assets/images/bc_logo.svg';
import PrintLogo from '~/assets/images/bc_logo_print.svg';
import BaseAuthButton from '~/components/base/BaseAuthButton.vue';
import BaseInternationalization from '~/components/base/BaseInternationalization.vue';
import { mapState } from 'pinia';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseAuthButton,
    BaseInternationalization,
  },
  data() {
    return {
      BCLogo: BCLogo,
      PrintLogo: PrintLogo,
    };
  },

  computed: {
    ...mapState(useFormStore, ['isRTL']),
    appTitle() {
      return this.$route && this.$route.meta && this.$route.meta.title
        ? this.$route.meta.title
        : import.meta.env.VITE_TITLE;
    },
    formSubmitMode() {
      // hide header content on form submitter pages
      return this.$route && this.$route.meta && this.$route.meta.formSubmitMode;
    },
  },
};
</script>

<template>
  <header
    :class="{
      'elevation-20': true,
      'gov-header': true,
    }"
    class="v-locale--is-ltr"
  >
    <!-- header for browser print only -->
    <div class="printHeader d-none d-print-block">
      <img
        alt="B.C. Government Logo"
        class="mr-1 d-inline"
        cover
        :src="PrintLogo"
      />
      <h1
        v-if="!formSubmitMode"
        data-test="btn-header-title"
        class="font-weight-bold text-h6 d-none d-md-inline pl-4"
      >
        {{ appTitle }}
      </h1>
    </div>

    <v-toolbar
      color="#003366"
      flat
      class="px-md-12 d-print-none"
      :class="{ 'v-locale--is-ltr': isRTL }"
    >
      <!-- Navbar content -->
      <a href="https://www2.gov.bc.ca" data-test="btn-header-logo">
        <v-img
          alt="B.C. Government Logo"
          class="d-flex"
          height="3.5rem"
          :src="BCLogo"
          width="10rem"
        />
      </a>
      <h1
        v-if="!formSubmitMode"
        data-test="btn-header-title"
        class="font-weight-bold text-h6 d-none d-md-flex pl-4"
      >
        {{ appTitle }}
      </h1>
      <v-spacer />
      <BaseAuthButton data-test="base-auth-btn" />
      <BaseInternationalization data-test="base-internationalization" />
    </v-toolbar>
  </header>
</template>

<style lang="scss" scoped>
@import 'vuetify/settings';

@media print {
  .elevation-20 {
    box-shadow: 0 0 0 0 !important;
  }
}

.gov-header {
  .printHeader {
    align-items: center;
    img {
      width: 10rem;
      height: 3.5rem;
    }
    .text-h6 {
      color: inherit;
    }
  }
  @media not print {
    border-bottom: 2px solid #fcba19;
  }
  .text-h6 {
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
