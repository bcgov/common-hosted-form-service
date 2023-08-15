import { createLocalVue, shallowMount } from '@vue/test-utils';
import BCGovFooter from '@/components/bcgov/BCGovFooter.vue';
import i18n from '@/internationalization';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BCGovFooter.vue', () => {
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
    const wrapper = shallowMount(BCGovFooter, {localVue, i18n, store});
    expect(wrapper.text()).toMatch('About gov.bc.ca');
  });
});

