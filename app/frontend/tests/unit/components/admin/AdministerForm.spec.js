import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect } from 'vitest';

import AdministerForm from '~/components/admin/AdministerForm.vue';
import { useAdminStore } from '~/store/admin';

describe('AdministerForm.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);

  beforeEach(() => {
    adminStore.$reset();
  });

  it('renders', async () => {
    adminStore.readForm.mockImplementation(() => {
      return {};
    });
    adminStore.readApiDetails.mockImplementation(() => {
      return {};
    });
    adminStore.readRoles.mockImplementation(() => {
      return [];
    });
    adminStore.form = {
      name: 'tehForm',
      versions: [],
    };
    const wrapper = mount(AdministerForm, {
      props: {
        formId: 'f',
      },
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('tehForm');
  });
});
