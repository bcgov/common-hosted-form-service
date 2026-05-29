import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import BCGovEnterpriseBanner from '~/components/bcgov/BCGovEnterpriseBanner.vue';
import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';

describe('BCGovEnterpriseBanner.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);
  const tenantStore = useTenantStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    tenantStore.$reset();
  });

  function mountBanner(props = {}) {
    return mount(BCGovEnterpriseBanner, {
      props,
      global: { plugins: [pinia] },
    });
  }

  it('does not render when user is not authenticated', () => {
    authStore.authenticated = false;
    tenantStore.isTenantFeatureEnabled = true;

    const wrapper = mountBanner();
    expect(wrapper.find('.context-banner').exists()).toBe(false);
  });

  it('does not render when tenant feature is disabled', () => {
    authStore.authenticated = true;
    tenantStore.isTenantFeatureEnabled = false;

    const wrapper = mountBanner();
    expect(wrapper.find('.context-banner').exists()).toBe(false);
  });

  it('does not render in form submit mode', () => {
    authStore.authenticated = true;
    tenantStore.isTenantFeatureEnabled = true;
    tenantStore.selectedTenant = null;

    const wrapper = mountBanner({ formSubmitMode: true });
    expect(wrapper.find('.context-banner').exists()).toBe(false);
  });

  it('shows personal banner when authenticated, feature enabled, no tenant selected', () => {
    authStore.authenticated = true;
    tenantStore.isTenantFeatureEnabled = true;
    tenantStore.selectedTenant = null;

    const wrapper = mountBanner();
    expect(wrapper.find('.context-banner').exists()).toBe(true);
    expect(wrapper.find('.personal-banner').exists()).toBe(true);
    expect(wrapper.find('.enterprise-banner').exists()).toBe(false);
    expect(wrapper.text()).toContain('Personal CHEFS');
  });

  it('shows enterprise banner when authenticated, feature enabled, tenant selected', () => {
    authStore.authenticated = true;
    tenantStore.isTenantFeatureEnabled = true;
    tenantStore.selectedTenant = { name: 'Ministry of Test', roles: [] };

    const wrapper = mountBanner();
    expect(wrapper.find('.context-banner').exists()).toBe(true);
    expect(wrapper.find('.enterprise-banner').exists()).toBe(true);
    expect(wrapper.find('.personal-banner').exists()).toBe(false);
    expect(wrapper.text()).toContain('Enterprise CHEFS');
    expect(wrapper.text()).toContain('Ministry of Test');
  });

  it('uses displayName as fallback when tenant has no name', () => {
    authStore.authenticated = true;
    tenantStore.isTenantFeatureEnabled = true;
    tenantStore.selectedTenant = { displayName: 'Fallback Tenant', roles: [] };

    const wrapper = mountBanner();
    expect(wrapper.find('.banner-tenant').text()).toBe('Fallback Tenant');
  });
});
