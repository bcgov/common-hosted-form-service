import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { expect, vi } from 'vitest';
import { nextTick } from 'vue';

import { rbacService } from '~/services';
import { useAuthStore } from '~/store/auth';
import Developer from '~/components/admin/Developer.vue';

describe('Developer.vue', () => {
  const mockConsoleError = vi.spyOn(console, 'error');
  const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
  const getCurrentUserFormsSpy = vi.spyOn(rbacService, 'getCurrentUserForms');

  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);

  beforeEach(() => {
    mockConsoleError.mockReset();
    getCurrentUserSpy.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    getCurrentUserSpy.mockRestore();
  });

  it('renders without error', async () => {
    const userData = { id: 'a' };
    const formsData = [];
    const resData = {
      ...userData,
      forms: formsData,
    };
    authStore.keycloak = {
      tokenParsed: {
        email: 'email@email.com',
        name: 'lucy',
      },
      userName: 'userName',
      token: 'token',
      fullName: 'fullName',
    };
    getCurrentUserSpy.mockImplementation(() => ({ data: userData }));
    getCurrentUserFormsSpy.mockImplementation(() => ({ data: formsData }));
    const wrapper = mount(Developer, {
      global: {
        props: {
          textToCopy: 'textToCopy',
        },
        plugins: [pinia],
        stubs: {
          BaseSecure: true,
          BaseCopyToClipboard: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toMatch('Developer Resources');
    expect(getCurrentUserSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.apiRes).toEqual(resData);
  });

  it('renders with error', async () => {
    authStore.keycloak = {
      tokenParsed: {
        email: 'email@email.com',
        name: 'lucy',
      },
      userName: 'userName',
      token: 'token',
      fullName: 'fullName',
    };
    getCurrentUserSpy.mockImplementation(() => {
      throw new Error('error');
    });
    const wrapper = mount(Developer, {
      global: {
        props: {
          textToCopy: 'textToCopy',
        },
        plugins: [pinia],
        stubs: {
          BaseSecure: true,
          BaseCopyToClipboard: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toMatch('Developer Resources');
    expect(getCurrentUserSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.apiRes).toMatch('');
  });
});
