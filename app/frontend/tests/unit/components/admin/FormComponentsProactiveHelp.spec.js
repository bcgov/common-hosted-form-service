import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import FormComponentsProactiveHelp from '@/components/admin/FormComponentsProactiveHelp.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('FormComponentsProactiveHelp.vue', () => {
  const extractGroupComponentsSpy = jest.spyOn(FormComponentsProactiveHelp.methods, 'extractGroupComponents');
  let store;

  beforeEach(() => {
    extractGroupComponentsSpy.mockReset();
    store = new Vuex.Store();
    store.registerModule('form', {
      namespaced: true,
      getters: {
        proactiveHelpInfoGroupObject: () => {},
        builder: () => {},
      },
    });
    store.registerModule('admin', {
      namespaced: true,
      getters: {
        fcHelpInfo: () => {},
      },
    });
  });

  afterAll(() => {
    extractGroupComponentsSpy.mockRestore();
  });

  it('renders ', async () => {
    const wrapper = shallowMount(FormComponentsProactiveHelp, {
      localVue,
      store,
      stubs: ['GeneralLayout'],
      i18n
    });

    wrapper.vm.onExpansionPanelClick('Basic Layout');
    expect(extractGroupComponentsSpy).toHaveBeenCalledTimes(1);
  });
});
