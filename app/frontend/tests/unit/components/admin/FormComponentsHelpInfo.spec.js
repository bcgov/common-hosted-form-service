import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import FormComponentsHelpInfo from '@/components/admin/FormComponentsHelpInfo.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('FormComponentsHelpInfo.vue', () => {
  const extractGroupComponentsSpy = jest.spyOn(FormComponentsHelpInfo.methods, 'extractGroupComponents');
  let store;

  beforeEach(() => {
    extractGroupComponentsSpy.mockReset();
    store = new Vuex.Store();
    store.registerModule('form', {
      namespaced: true,
      getters: {
        fcHelpInfoGroupObject: () => {},
        builder: () => {},
      }
    });
    store.registerModule('admin', {
      namespaced: true,
      getters: {
        fcHelpInfo: () => {},
      }
    });
  });

  afterAll(() => {
    extractGroupComponentsSpy.mockRestore();
  });

  it('renders ', async () => {
    const wrapper = shallowMount(FormComponentsHelpInfo, {
      localVue,
      store,
      stubs: ['GeneralLayout']
    });

    wrapper.vm.onExpansionPanelClick('Basic Layout');
    expect(extractGroupComponentsSpy).toHaveBeenCalledTimes(1);
  });
});
