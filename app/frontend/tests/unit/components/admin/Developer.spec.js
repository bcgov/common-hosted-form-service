import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';

import { rbacService } from '@/services';
import Developer from '@/components/admin/Developer.vue';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('Developer.vue', () => {
  const mockConsoleError = jest.spyOn(console, 'error');
  const getCurrentUserSpy = jest.spyOn(rbacService, 'getCurrentUser');
  let store;

  beforeEach(() => {
    mockConsoleError.mockReset();
    getCurrentUserSpy.mockReset();

    store = new Vuex.Store();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        fullName: () => 'fullName',
        token: () => 'token',
        tokenParsed: () => ({}),
        userName: () => 'userName',
      },
    });
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    getCurrentUserSpy.mockRestore();
  });

  it('renders without error', async () => {
    const data = {};
    getCurrentUserSpy.mockImplementation(() => ({ data: data }));
    const wrapper = shallowMount(Developer, {
      localVue,
      store,
      stubs: ['BaseSecure'],
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Developer Resources');
    expect(getCurrentUserSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.apiRes).toEqual(data);
  });

  it('renders with error', async () => {
    getCurrentUserSpy.mockImplementation(() => {
      throw new Error('error');
    });
    const wrapper = shallowMount(Developer, {
      localVue,
      store,
      stubs: ['BaseSecure'],
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Developer Resources');
    expect(getCurrentUserSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.apiRes).toMatch('');
  });
});
