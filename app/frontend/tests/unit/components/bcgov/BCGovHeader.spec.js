import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useRoute } from 'vue-router';

import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import { useAuthStore } from '~/store/auth';
import { useAppStore } from '~/store/app';

vi.mock('vue-router');

describe('BCGovHeader.vue', () => {
  let pinia;
  let authStore;
  let wrappers = [];

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    authStore = useAuthStore();
    // Mock keycloak so identityProvider getter doesn't throw
    authStore.keycloak = { tokenParsed: null };
    authStore.ready = true;
    // Default: route without a name (showTenantDropdown returns false early)
    useRoute.mockReturnValue({ name: null });
  });

  afterEach(() => {
    wrappers.forEach((w) => {
      if (w && typeof w.unmount === 'function') {
        w.unmount();
      }
    });
    wrappers = [];
  });

  const mountHeader = (props = {}, routeName = null) => {
    useRoute.mockReturnValue({ name: routeName });
    const wrapper = mount(BCGovHeader, {
      props: { formSubmitMode: false, appTitle: 'Test App', ...props },
      global: {
        plugins: [pinia],
        stubs: {
          BaseAuthButton: true,
          BaseInternationalization: true,
          TenantDropdown: true,
        },
      },
    });
    wrappers.push(wrapper);
    return wrapper;
  };

  it('if formSubmitMode is false then show the app title', () => {
    const APP_TITLE = 'This is an app title';
    const wrapper = mountHeader({ formSubmitMode: false, appTitle: APP_TITLE });

    const btnHeaderTitle = wrapper.find('[data-test="btn-header-title"]');
    expect(btnHeaderTitle.exists()).toBeTruthy();
    expect(btnHeaderTitle.text()).toContain(APP_TITLE);
    expect(wrapper.find('[data-test="base-auth-btn"]').exists()).toBeTruthy();
    expect(
      wrapper.find('[data-test="base-internationalization"]').exists()
    ).toBeTruthy();
  });

  it('if formSubmitMode is true then do not show the app title', () => {
    const APP_TITLE = 'This is an app title';
    const wrapper = mountHeader({ formSubmitMode: true, appTitle: APP_TITLE });

    const btnHeaderTitle = wrapper.find('[data-test="btn-header-title"]');
    expect(btnHeaderTitle.exists()).toBeFalsy();
    expect(wrapper.html()).not.toContain(APP_TITLE);
    expect(wrapper.find('[data-test="base-auth-btn"]').exists()).toBeTruthy();
    expect(
      wrapper.find('[data-test="base-internationalization"]').exists()
    ).toBeTruthy();
  });

  // ── showTenantDropdown ───────────────────────────────────────────────────

  describe('showTenantDropdown', () => {
    beforeEach(() => {
      // Authenticated user on an allowed route by default
      authStore.authenticated = true;
      authStore.ready = true;
    });

    it('hides dropdown when tenant feature is disabled', () => {
      const appStore = useAppStore();
      appStore.config = { tenantFeatureEnabled: false };

      const wrapper = mountHeader({}, 'UserForms');

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(false);
    });

    it('hides dropdown when user is not authenticated', () => {
      authStore.authenticated = false;

      const wrapper = mountHeader({}, 'UserForms');

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(false);
    });

    it('hides dropdown when auth store is not ready', () => {
      authStore.ready = false;

      const wrapper = mountHeader({}, 'UserForms');

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(false);
    });

    it('hides dropdown when route has no name', () => {
      const wrapper = mountHeader({}, null);

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(false);
    });

    it.each([
      'Admin',
      'AdministerForm',
      'AdministerUser',
      'FormSubmit',
      'FormSuccess',
      'UserSubmissions',
      'UserFormView',
      'UserFormDraftEdit',
      'UserFormDuplicate',
    ])('hides dropdown for excluded route: %s', (routeName) => {
      const wrapper = mountHeader({}, routeName);

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(false);
    });

    it('shows dropdown for an allowed route', () => {
      const appStore = useAppStore();
      appStore.config = { tenantFeatureEnabled: true };

      const wrapper = mountHeader({}, 'UserForms');

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(true);
    });

    it('shows dropdown for CreateForm route', () => {
      const appStore = useAppStore();
      appStore.config = { tenantFeatureEnabled: true };

      const wrapper = mountHeader({}, 'CreateForm');

      expect(wrapper.find('.tenant-dropdown-wrapper').exists()).toBe(true);
    });
  });
});
