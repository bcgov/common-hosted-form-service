import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useTenantStore } from '~/store/tenant';
import Forms from '~/views/user/Forms.vue';

const STUBS = {
  FormsTable: true,
  BaseSecure: {
    name: 'BaseSecure',
    template: '<div class="base-secure-stub"><slot /></div>',
  },
};

describe('Forms.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const tenantStore = useTenantStore(pinia);

  beforeEach(() => {
    tenantStore.$reset();
  });

  it('renders FormsTable directly when tenant feature is disabled', () => {
    tenantStore.isTenantFeatureEnabled = false;

    const wrapper = mount(Forms, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).toMatch('forms-table');
    expect(wrapper.find('.base-secure-stub').exists()).toBe(false);
  });

  it('wraps FormsTable in BaseSecure when tenant feature is enabled', () => {
    tenantStore.isTenantFeatureEnabled = true;

    const wrapper = mount(Forms, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.base-secure-stub').exists()).toBe(true);
    expect(wrapper.html()).toMatch('forms-table');
  });
});
