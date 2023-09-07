import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(Vuex);

describe('FormDisclaimer.vue', () => {
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
    const wrapper = shallowMount(FormDisclaimer, {
      localVue,
      i18n,
      store
    });
    expect(wrapper.text()).toMatch('Disclaimer and statement of responsibility for Form Designers:');
  });
});
