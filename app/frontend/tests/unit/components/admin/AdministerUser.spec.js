import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect } from 'vitest';

import AdministerUser from '~/components/admin/AdministerUser.vue';
import { useAppStore } from '~/store/app';
import { useAdminStore } from '~/store/admin';

describe('AdministerUser.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const appStore = useAppStore(pinia);
  const adminStore = useAdminStore(pinia);

  beforeEach(() => {
    appStore.$reset();
    adminStore.$reset();
  });

  it('renders', async () => {
    appStore.config = {
      oidc: {
        serverUrl: 'servU',
        realm: 'theRealm',
      },
    };
    adminStore.readUser.mockImplementation(() => {});
    adminStore.user = {
      fullName: 'alice',
      keycloakId: '1',
    };
    const wrapper = mount(AdministerUser, {
      props: {
        userId: 'me',
      },
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('alice');
  });

  it('updates the stale status', async () => {
    adminStore.readUser.mockImplementation(() => {});
    adminStore.updateUser.mockResolvedValue();
    adminStore.user = {
      fullName: 'alice',
      keycloakId: '1',
      stale: false,
    };
    const wrapper = mount(AdministerUser, {
      props: {
        userId: 'me',
      },
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });

    await flushPromises();
    wrapper
      .findComponent({ name: 'VSwitch' })
      .vm.$emit('update:modelValue', true);
    await flushPromises();

    expect(adminStore.updateUser).toHaveBeenCalledWith('me', { stale: true });
  });
});
