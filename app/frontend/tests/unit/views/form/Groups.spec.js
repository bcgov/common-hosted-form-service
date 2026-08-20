import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'vue-router';

import { useTenantStore } from '~/store/tenant';
import Groups from '~/views/form/Groups.vue';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
  })),
}));

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

  it('redirects to UserForms and hides content when tenant feature is disabled', async () => {
    const replace = vi.fn();
    useRouter.mockImplementationOnce(() => ({ replace }));
    tenantStore.isTenantFeatureEnabled = false;

    const wrapper = mount(Groups, {
      props: { f: 'form-123' },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(replace).toHaveBeenCalledWith({ name: 'UserForms' });
    expect(wrapper.find('.base-secure-stub').exists()).toBe(false);
  });

  it('wraps GroupManagement in BaseSecure when tenant feature is enabled', async () => {
    tenantStore.isTenantFeatureEnabled = true;

    const wrapper = mount(Groups, {
      props: { f: 'form-123' },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.find('.base-secure-stub').exists()).toBe(true);
  });
});
