import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';
import About from '~/views/About.vue';

describe('About.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);
  const tenantStore = useTenantStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    tenantStore.$reset();
  });

  it('renders', () => {
    const wrapper = mount(About, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseImagePopout: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.homePage.title');
    expect(wrapper.text()).toMatch('trans.homePage.subTitle');
    expect(wrapper.text()).toMatch('trans.homePage.takeATourOfChefs');
    expect(wrapper.text()).toMatch('trans.homePage.chefsHowToTitle');
    expect(wrapper.text()).toMatch('trans.homePage.chefsHowToSub');
    expect(wrapper.text()).toMatch('trans.homePage.getStarted');
    expect(wrapper.text()).toMatch('trans.homePage.createCustomFormTitle');
    expect(wrapper.text()).toMatch('trans.homePage.createCustomFormSub1');
    expect(wrapper.text()).toMatch('trans.homePage.manageAccessTitle');
    expect(wrapper.text()).toMatch('trans.homePage.manageAccessSub1');
    expect(wrapper.text()).toMatch('trans.homePage.manageAccessSub2');
    expect(wrapper.text()).toMatch('trans.homePage.getStartedToChefs');
    expect(wrapper.text()).toMatch('trans.homePage.createOnlineTitle');
  });

  it('renders with login button', () => {
    const wrapper = mount(About, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseImagePopout: true,
        },
      },
    });

    const createOrLoginBtn = wrapper.find('[data-test="create-or-login-btn"]');
    expect(createOrLoginBtn.exists()).toBeTruthy();
    expect(createOrLoginBtn.text()).toMatch('trans.homePage.loginToStart');
  });

  it('renders with create form button', () => {
    authStore.authenticated = true;
    const wrapper = mount(About, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseImagePopout: true,
        },
      },
    });

    const createOrLoginBtn = wrapper.find('[data-test="create-or-login-btn"]');
    expect(createOrLoginBtn.exists()).toBeTruthy();
    expect(createOrLoginBtn.text()).toMatch('trans.homePage.createFormLabel');
  });

  it('does not render multitenancy card when tenant feature is disabled', () => {
    tenantStore.isTenantFeatureEnabled = false;
    const wrapper = mount(About, {
      global: {
        plugins: [pinia],
        stubs: { BaseImagePopout: true },
      },
    });

    expect(wrapper.find('.multitenancy-card').exists()).toBe(false);
  });

  it('renders multitenancy card when tenant feature is enabled', () => {
    tenantStore.isTenantFeatureEnabled = true;
    const wrapper = mount(About, {
      global: {
        plugins: [pinia],
        stubs: { BaseImagePopout: true },
      },
    });

    expect(wrapper.find('.multitenancy-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('trans.homePage.multiTenancyTitle');
    expect(wrapper.text()).toContain('trans.homePage.multiTenancySubTitle');
    expect(wrapper.text()).toContain('trans.homePage.multiTenancyFitHeading');
    expect(wrapper.text()).toContain('trans.homePage.multiTenancyFooter');
  });
});
