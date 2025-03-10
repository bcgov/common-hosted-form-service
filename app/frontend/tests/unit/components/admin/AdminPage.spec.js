import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect } from 'vitest';

import AdminPage from '~/components/admin/AdminPage.vue';
import { useAppStore } from '~/store/app';

describe('AdminPage.vue', () => {
  const pinia = createTestingPinia();
  let wrapper;

  setActivePinia(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    appStore.$reset();
    appStore.config = {}; // Default value
    wrapper = mount(AdminPage, {
      global: {
        plugins: [pinia],
        provide: {
          config: appStore.config,
        },
        stubs: {
          AdminFormsTable: true,
          AdminUsersTable: true,
          Developer: true,
          FormComponentsProactiveHelp: true,
          Metrics: true,
        },
      },
    });
  });

  it('renders', async () => {
    expect(wrapper.text()).toContain('trans.adminPage.forms');
    expect(wrapper.text()).not.toContain('trans.adminPage.metrics');
  });

  it('renders without metrics', async () => {
    appStore.config = { adminDashboardUrl: '' };
    await wrapper.vm.$nextTick(); // Wait for reactivity
    expect(wrapper.text()).not.toContain('trans.adminPage.metrics');
  });

  it('renders with metrics', async () => {
    appStore.config = { adminDashboardUrl: 'x' };
    await wrapper.vm.$nextTick(); // Wait for reactivity
    expect(wrapper.text()).toContain('trans.adminPage.metrics');
  });
});
