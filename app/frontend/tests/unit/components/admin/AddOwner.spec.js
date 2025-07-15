import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { beforeEach, expect, vi } from 'vitest';

import AddOwner from '~/components/admin/AddOwner.vue';
import { useAdminStore } from '~/store/admin';

describe('AddOwner.vue', () => {
  const pinia = createTestingPinia();
  const adminStore = useAdminStore(pinia);

  const addFormUserSpy = vi.spyOn(adminStore, 'addFormUser');

  beforeEach(() => {
    adminStore.$reset();

    addFormUserSpy.mockReset();
    addFormUserSpy.mockImplementationOnce(() => {});
  });

  it('renders', async () => {
    const wrapper = mount(AddOwner, {
      props: {
        formId: 'f',
      },
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    expect(wrapper.text())
      .toContain('trans.addOwner.infoA')
      .toContain('trans.addOwner.label');
  });

  it('renders', async () => {
    const wrapper = shallowMount(AddOwner, {
      props: {
        formId: 'f',
      },
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    const validate = vi.fn();

    wrapper.vm.addUserForm = {
      validate: validate,
    };

    validate.mockImplementationOnce(() => {
      return true;
    });

    await wrapper.vm.addOwner();

    expect(addFormUserSpy).toBeCalledTimes(1);
  });
});
