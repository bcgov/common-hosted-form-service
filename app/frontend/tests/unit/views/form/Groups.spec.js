import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useTenantStore } from '~/store/tenant';
import Groups from '~/views/form/Groups.vue';

const STUBS = {
  GroupManagement: true,
  BaseSecure: {
    name: 'BaseSecure',
    template: '<div class="base-secure-stub"><slot /></div>',
  },
};

describe('Groups.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const tenantStore = useTenantStore(pinia);

  beforeEach(() => {
    tenantStore.$reset();
  });

  it('renders GroupManagement directly when tenant feature is disabled', () => {
    tenantStore.isTenantFeatureEnabled = false;

    const wrapper = mount(Groups, {
      props: { f: 'form-123' },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).toMatch('group-management');
    expect(wrapper.find('.base-secure-stub').exists()).toBe(false);
  });

  it('wraps GroupManagement in BaseSecure when tenant feature is enabled', () => {
    tenantStore.isTenantFeatureEnabled = true;

    const wrapper = mount(Groups, {
      props: { f: 'form-123' },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.base-secure-stub').exists()).toBe(true);
    expect(wrapper.html()).toMatch('group-management');
  });
});
