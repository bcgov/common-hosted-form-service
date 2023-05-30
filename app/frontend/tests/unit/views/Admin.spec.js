import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import Admin from '@/views/Admin.vue';

const localVue = createLocalVue();
localVue.use(Vuex);


describe('Admin.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        isAdmin: () => false,
      },
    });
  });

  it('renders without error', async () => {
    store.registerModule('admin', { namespaced: true });

    const wrapper = shallowMount(Admin, {
      localVue,
      store,
      stubs: ['BaseSecure', 'router-view'],
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toMatch('router-view');
  });
});
