<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import BCLogo from '~/assets/images/bc_logo.svg';
import PrintLogo from '~/assets/images/bc_logo_print.svg';
import { useFormStore } from '~/store/form';
import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';
import TenantDropdown from '~/components/base/TenantDropdown.vue';

const props = defineProps({
  formSubmitMode: {
    type: Boolean,
    default: false,
  },
  appTitle: {
    type: String,
    default: 'Common Hosted Forms',
  },
});

const route = useRoute();
const { isRTL } = storeToRefs(useFormStore());
const { authenticated, ready } = storeToRefs(useAuthStore());
const tenantStore = useTenantStore();

const appBase = computed(() => props.appTitle);

// Show tenant dropdown on all authenticated pages EXCEPT:
// - Admin pages
// - Submission viewing/submission pages (formSubmitMode routes)
const showTenantDropdown = computed(() => {
  if (!tenantStore.isTenantFeatureEnabled || tenantStore.isTenantIneligibleUser)
    return false;
  if (!ready.value || !authenticated.value || !route.name) {
    return false;
  }

  // Exclude these routes from showing tenant dropdown
  const excludedRoutes = [
    'Admin', // Admin panel
    'AdministerForm', // Admin form management
    'AdministerUser', // Admin user management
    'FormSubmit', // Public form submission
    'FormSuccess', // Submission success page
    'UserSubmissions', // User's submissions
    'UserFormView', // User viewing their submission
    'UserFormDraftEdit', // User editing draft
    'UserFormDuplicate', // User duplicating submission
  ];

  const shouldShow = !excludedRoutes.includes(route.name);

  return shouldShow;
});
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
      class="px-1 px-sm-4 px-md-12 d-print-none"
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
        class="font-weight-bold text-h6 pl-4 header-title d-none d-md-flex"
      >
        {{ appBase }}
      </h1>
      <v-spacer />
      <div class="header-actions">
        <!-- Tenant Dropdown (visible only on Forms list and Create Form pages) -->
        <div v-if="showTenantDropdown" class="tenant-dropdown-wrapper">
          <TenantDropdown />
        </div>
        <BaseOfflineControl data-test="base-offline-control" />
        <BaseAuthButton data-test="base-auth-btn" />
        <BaseInternationalization data-test="base-internationalization" />
      </div>
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
    // Truncate long app titles instead of pushing the right-side controls off-screen.
    white-space: nowrap;
    text-overflow: ellipsis;
    // Allow the flex item to shrink below its natural content width.
    min-width: 0;
    flex: 0 1 auto;
    @media #{map-get($display-breakpoints, 'sm-and-down')} {
      font-size: 1rem !important;
    }
  }
}

// Right-side cluster: dropdown + logout + language picker.
// Guaranteed gap prevents the overlap reported in CCP-3927.
.header-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  @media (max-width: 599px) {
    gap: 0.5rem;
  }

  :deep(.v-btn) {
    // Icon-only on tablet/mobile — keep button compact
    min-width: 40px !important;
    padding-inline: 8px !important;

    .v-btn__content {
      gap: 6px;
    }

    // Icon + text on lg+ — restore Vuetify's default side padding
    @media #{map-get($display-breakpoints, 'lg-and-up')} {
      min-width: 64px !important;
      padding-inline: 16px !important;
    }
  }
}

.tenant-dropdown-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex-shrink: 0;

  // Hide info icon at tablet/mobile — only shown on full desktop (lg+).
  @media (max-width: 1279px) {
    :deep(.info-icon) {
      display: none !important;
    }
  }

  // Override the dropdown select width at each breakpoint so it fits
  // alongside logout + language in the toolbar without overflowing.
  :deep(.tenant-select) {
    width: 200px; // lg+ desktop default (narrower than standalone 280px)

    @media (max-width: 1279px) {
      width: 180px; // tablet landscape
    }

    @media (max-width: 959px) {
      width: 160px; // tablet portrait
    }

    @media (max-width: 599px) {
      width: 60px !important;
      max-width: 60px !important;

      .v-field__field {
        display: none !important;
      }
    }
  }

  :deep(.tenant-dropdown-container) {
    display: flex;
    flex-direction: row !important;
    align-items: center !important;
    gap: 0.5rem;
    width: auto !important;
    min-width: 0;

    .tenant-select {
      :deep(.v-field) {
        height: 40px !important;
        min-height: 40px !important;
      }

      :deep(.v-field__input) {
        color: #ffffff !important;
        font-size: 0.9rem !important;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex !important;
        align-items: center !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      :deep(.v-field__input input) {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        color: #ffffff !important;
        flex: 1;
      }

      :deep(.v-select__content) {
        padding: 0 !important;
      }

      :deep(.v-field__outline__start),
      :deep(.v-field__outline__end) {
        border-color: rgba(255, 255, 255, 0.3) !important;
      }

      &:hover:not(:disabled) {
        :deep(.v-field__outline__start),
        :deep(.v-field__outline__end) {
          border-color: rgba(255, 255, 255, 0.5) !important;
        }
      }

      &:focus-within {
        :deep(.v-field__outline__start),
        :deep(.v-field__outline__end) {
          border-color: #fcba19 !important;
        }
      }

      // Dropdown menu styling in header
      :deep(.v-list) {
        padding: 0 !important;
      }

      :deep(.v-list-item) {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        padding-top: 0.75rem !important;
        padding-bottom: 0.75rem !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);

        &:last-of-type:not(.cstar-link-item) {
          border-bottom: none;
        }
      }

      :deep(.v-list-item__prepend) {
        margin-right: 1rem !important;
        margin-left: 0 !important;
      }

      :deep(.v-list-item--title) {
        white-space: normal !important;
        word-break: break-word !important;
      }

      :deep(.classic-chefs-link-item) {
        color: var(--v-primary) !important;
        border-bottom: none !important;
        border-top: none !important;
        min-height: auto !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        padding-top: 0.75rem !important;
        padding-bottom: 0.75rem !important;

        :deep(.v-icon) {
          margin-right: 1rem !important;
        }

        span {
          white-space: normal !important;
          word-break: break-word !important;
          line-height: 1.4;
          display: block;
        }
      }

      :deep(.cstar-link-item) {
        color: var(--v-primary) !important;
        border-bottom: none !important;
        border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
        min-height: auto !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        padding-top: 0.75rem !important;
        padding-bottom: 0.75rem !important;

        :deep(.v-icon) {
          margin-right: 1rem !important;
        }

        span {
          white-space: normal !important;
          word-break: break-word !important;
          line-height: 1.4;
          display: block;
        }
      }

      :deep(.v-divider) {
        display: none !important;
      }

      :deep(.cstar-link) {
        color: var(--v-primary) !important;
      }
    }

    .helper-link {
      color: #fcba19 !important;

      &:hover {
        color: #ffffff !important;
      }
    }

    .tenant-helper-text {
      display: none; // Hide in header, only show in standalone context
    }
  }
}
</style>
