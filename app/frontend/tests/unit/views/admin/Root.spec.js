import { createLocalVue, shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import Root from '@/views/admin/Root.vue';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('Root.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
  });

  it('renders without error', async () => {
    store.registerModule('admin', { namespaced: true });

    const wrapper = shallowMount(Root, {
      localVue,
      store,
      stubs: ['BaseSecure'],
      i18n
    });
    await nextTick();

    expect(wrapper.text()).toMatch('Admin');
  });
});
