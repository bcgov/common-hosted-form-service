import { createLocalVue, shallowMount } from '@vue/test-utils';
import Preview from '@/views/form/Preview.vue';
import i18n from '@/internationalization';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);


describe('Preview.vue', () => {
  const mockisRTLGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            isRTL: mockisRTLGetter,
          },
        },
      },
    });
  });
  it('renders', () => {
    const wrapper = shallowMount(Preview, {
      localVue,
      stubs: ['BaseSecure', 'FormViewer'],
      i18n,
      store
    });

    expect(wrapper.html()).toMatch('basesecure');
  });
});
