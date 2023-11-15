import { createLocalVue, shallowMount } from '@vue/test-utils';
import History from '@/views/user/History.vue';
import Vuex from 'vuex';
import i18n from '@/internationalization';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('History.vue', () => {
  const mockLangGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            lang: mockLangGetter,
          },
        },
      },
    });
  });

  it('renders', () => {
    const wrapper = shallowMount(History, {
      localVue,
      stubs: ['BaseSecure'],
      i18n,
      store
    });

    expect(wrapper.text()).toMatch('Your Submission History');
  });
});
