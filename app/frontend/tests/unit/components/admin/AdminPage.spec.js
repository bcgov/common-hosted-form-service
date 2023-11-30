import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect } from 'vitest';

import AdminPage from '~/components/admin/AdminPage.vue';
import { useAppStore } from '~/store/app';

describe('AdminPage.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    appStore.$reset();
  });

  it('renders', async () => {
    appStore.config = {};
    const wrapper = mount(AdminPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AdminFormsTable: true,
          AdminUsersTable: true,
          Developer: true,
          FormComponentsProactiveHelp: true,
          Metrics: true,
        },
      },
    });

    expect(wrapper.text()).toContain('trans.adminPage.forms');
    expect(wrapper.text()).not.toContain('trans.adminPage.metrics');
  });

  it('renders without metrics', async () => {
    appStore.config = {
      adminDashboardUrl: '',
    };
    const wrapper = mount(AdminPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AdminFormsTable: true,
          AdminUsersTable: true,
          Developer: true,
          FormComponentsProactiveHelp: true,
          Metrics: true,
        },
      },
    });

    expect(wrapper.text()).not.toContain('trans.adminPage.metrics');
  });

  it('renders with metrics', async () => {
    appStore.config = {
      adminDashboardUrl: 'x',
    };
    const wrapper = mount(AdminPage, {
      global: {
        plugins: [pinia],
        stubs: {
          AdminFormsTable: true,
          AdminUsersTable: true,
          Developer: true,
          FormComponentsProactiveHelp: true,
          Metrics: true,
        },
      },
    });

    expect(wrapper.text()).toContain('trans.adminPage.metrics');
  });
});
