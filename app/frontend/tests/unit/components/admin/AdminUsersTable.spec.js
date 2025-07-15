import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';

import AdminUsersTable from '~/components/admin/AdminUsersTable.vue';
import { useAdminStore } from '~/store/admin';

const STUBS = {
  AdminFormsTable: true,
  AdminUsersTable: true,
  Developer: true,
  FormComponentsProactiveHelp: true,
  Metrics: true,
  RouterLink: {
    name: 'RouterLink',
    template: '<div class="router-link-stub"><slot /></div>',
  },
};

describe('AdminUsersTable.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);

  const getUsersSpy = vi.spyOn(adminStore, 'getUsers');
  getUsersSpy.mockImplementation(() => {});

  beforeEach(() => {
    adminStore.$reset();
  });

  it('renders', async () => {
    const wrapper = mount(AdminUsersTable, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.adminUsersTable.search');
    expect(wrapper.text()).toContain('trans.adminUsersTable.fullName');
    expect(wrapper.text()).toContain('trans.adminUsersTable.userID');
    expect(wrapper.text()).toContain('trans.adminUsersTable.created');
    expect(wrapper.text()).toContain('trans.adminUsersTable.actions');
    expect(wrapper.text()).toContain('trans.adminUsersTable.loadingText');

    expect(getUsersSpy).toBeCalledTimes(1);
  });
});
