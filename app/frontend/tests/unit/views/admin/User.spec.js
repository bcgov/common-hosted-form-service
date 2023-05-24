import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import User from '@/views/admin/User.vue';

const localVue = createLocalVue();


localVue.use(Vuex);

describe('User.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
  });

  it('renders without error', async () => {
    store.registerModule('admin', { namespaced: true });

    const wrapper = shallowMount(User, {
      localVue,
      propsData: { u: 'u' },
      store,
      stubs: ['BaseSecure'],
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Admin');
  });
});
