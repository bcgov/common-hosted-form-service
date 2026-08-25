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
      idpCode: 'idir',
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

  it.each(['idir', 'azureidir'])(
    'shows the stale switch for %s users',
    async (idpCode) => {
      adminStore.readUser.mockImplementation(() => {});
      adminStore.user = {
        fullName: 'alice',
        keycloakId: '1',
        idpCode,
        stale: false,
      };

      const wrapper = mount(AdministerUser, {
        props: { userId: 'me' },
        global: {
          plugins: [pinia],
          stubs: {},
        },
      });

      await flushPromises();

      expect(wrapper.find('[data-test="stale-user-switch"]').exists()).toBe(
        true
      );
    }
  );

  it('hides the stale switch for non-IDIR users', async () => {
    adminStore.readUser.mockImplementation(() => {});
    adminStore.user = {
      fullName: 'alice',
      keycloakId: '1',
      idpCode: 'bceidbusiness',
      stale: false,
    };

    const wrapper = mount(AdministerUser, {
      props: { userId: 'me' },
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-test="stale-user-switch"]').exists()).toBe(
      false
    );
  });
});
