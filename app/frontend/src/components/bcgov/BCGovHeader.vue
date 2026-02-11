<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import BCLogo from '~/assets/images/bc_logo.svg';
import PrintLogo from '~/assets/images/bc_logo_print.svg';
import { useFormStore } from '~/store/form';
import { useAuthStore } from '~/store/auth';
import TenantDropdown from '~/components/base/TenantDropdown.vue';

defineProps({
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

// Show tenant dropdown on all authenticated pages EXCEPT:
// - Admin pages
// - Submission viewing/submission pages (formSubmitMode routes)
const showTenantDropdown = computed(() => {
  if (!ready.value || !authenticated.value || !route.name) {
    return false;
  }

  // Exclude these routes from showing tenant dropdown
  const excludedRoutes = [
    'Admin', // Admin panel
    'AdministerForm', // Admin form management
    'AdministerUser', // Admin user management
    'FormSubmissions', // Viewing form submissions
    'FormSubmit', // Public form submission
    'FormView', // Viewing a submission
    'FormSuccess', // Submission success page
    'FormPreview', // Form preview
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
      <!-- Tenant Dropdown (visible only on Forms list and Create Form pages) -->
      <div v-if="showTenantDropdown" class="tenant-dropdown-wrapper mr-4">
        <TenantDropdown />
      </div>
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

.tenant-dropdown-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  min-width: 0;
  width: auto;

  // Mobile: stacked layout
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;

    :deep(.tenant-label-wrapper) {
      display: flex !important;
    }

    :deep(.tenant-input-wrapper) {
      width: 100%;
    }
  }

  // Tablet and above: horizontal layout (one line)
  @media (min-width: 601px) {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;

    :deep(.tenant-label-wrapper) {
      flex-shrink: 0;
      white-space: nowrap;
      display: flex !important;
      align-items: center;
    }

    :deep(.tenant-input-wrapper) {
      width: 280px !important;
      flex-shrink: 0;
    }
  }

  :deep(.tenant-dropdown-container) {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: auto;

    .tenant-label-wrapper {
      display: flex !important;
      align-items: center;
      gap: 0.5rem;

      .tenant-label {
        color: #ffffff !important;
        font-size: 0.85rem !important;
        font-weight: 600 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: inline-block !important;
        line-height: 1.4;
        text-decoration: none;

        .label-suffix {
          display: none !important; // Hide suffix in header to save space
        }
      }

      .info-icon {
        color: #fcba19 !important;
      }
    }

    .tenant-input-wrapper {
      @media (max-width: 600px) {
        width: 100% !important;
        flex: 1 !important;
      }

      @media (min-width: 601px) {
        width: 280px !important;
        flex-shrink: 0 !important;
      }
    }

    .tenant-select {
      :deep(.v-field__input) {
        color: #ffffff !important;
        font-size: 0.9rem !important;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex !important;
        align-items: center !important;
        padding: 0.5rem 1rem !important;
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
