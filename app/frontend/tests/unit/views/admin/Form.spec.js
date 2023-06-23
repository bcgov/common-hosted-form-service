import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import Form from '@/views/admin/Form.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Form.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
  });

  it('renders without error', async () => {
    store.registerModule('admin', { namespaced: true });

    const wrapper = shallowMount(Form, {
      localVue,
      propsData: { f: 'f' },
      store,
      stubs: ['BaseSecure'],
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Admin');
  });
});
