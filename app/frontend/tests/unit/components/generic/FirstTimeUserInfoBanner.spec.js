import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import FirstTimeUserInfoBanner from '@/components/generic/FirstTimeUserInfoBanner.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('FirstTimeUserInfoBanner.vue', () => {
  const mockIsRTLGetter = jest.fn();
  const mockLangGetter = jest.fn();
  const mockFirstTimeUserLoginGetter = jest.fn();
  let store;
  const formActions = {
    setFirstTimeUserLoginr: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            isRTL: mockIsRTLGetter,
            lang: mockLangGetter,
            firstTimeUserLogin: mockFirstTimeUserLoginGetter,
          },
          actions: formActions,
        },
      },
    });
  });

  afterEach(() => {
    mockIsRTLGetter.mockReset();
    mockLangGetter.mockReset();
    mockFirstTimeUserLoginGetter.mockReset();
  });

  it('renders', () => {
    mockFirstTimeUserLoginGetter.mockReturnValue(true);
    const wrapper = shallowMount(FirstTimeUserInfoBanner, {
      localVue,
      store,
      stubs: ['BaseDialog'],
      i18n
    });
    expect(wrapper.text()).toMatch('Welcome');
  });

});
