import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import i18n from '@/internationalization';
import Vuex from 'vuex';
import NotFound from '@/views/NotFound.vue';

const localVue = createLocalVue();

localVue.use(VueRouter);
localVue.use(Vuex);

describe('NotFound.vue', () => {

  const mockMultiLanguageGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            multiLanguage: mockMultiLanguageGetter,
          },
        },
      },
    });
  });

  it('renders', () => {
    const wrapper = shallowMount(NotFound, {
      localVue,
      stubs: ['router-link'],
      i18n,
      store
    });

    expect(wrapper.text()).toMatch('404: Page not found. :(');
  });
});
