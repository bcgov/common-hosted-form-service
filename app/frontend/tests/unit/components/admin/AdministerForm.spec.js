import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';

import AdministerForm from '~/components/admin/AdministerForm.vue';
import { useAdminStore } from '~/store/admin';

describe('AdministerForm.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);

  const readFormSpy = vi.spyOn(adminStore, 'readForm');
  const readApiDetailsSpy = vi.spyOn(adminStore, 'readApiDetails');
  const readRolesSpy = vi.spyOn(adminStore, 'readRoles');

  beforeEach(() => {
    adminStore.$reset();

    readFormSpy.mockReset();
    readApiDetailsSpy.mockReset();
    readRolesSpy.mockReset();
  });

  it('renders', async () => {
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

  it('deleteKey calls deleteApiKey', async () => {
    const wrapper = shallowMount(AdministerForm, {
      props: {
        formId: 'f',
      },
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });

    await flushPromises();

    const deleteApiKeySpy = vi.spyOn(adminStore, 'deleteApiKey');
    deleteApiKeySpy.mockImplementation(() => {});

    await wrapper.vm.deleteKey();
    expect(deleteApiKeySpy).toBeCalledTimes(1);
  });

  it('restore calls restoreForm', async () => {
    const wrapper = shallowMount(AdministerForm, {
      props: {
        formId: 'f',
      },
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });

    await flushPromises();

    const restoreFormSpy = vi.spyOn(adminStore, 'restoreForm');
    restoreFormSpy.mockImplementation(() => {});

    await wrapper.vm.restore();
    expect(restoreFormSpy).toBeCalledTimes(1);
  });
});
