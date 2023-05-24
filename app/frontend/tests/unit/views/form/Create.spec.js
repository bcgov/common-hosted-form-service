import { createLocalVue, shallowMount } from '@vue/test-utils';

jest.mock('vuex-map-fields', () => ({
  getterType: jest.fn(),
  mapFields: jest.fn(),
}));

import Vuex from 'vuex';

import Create from '@/views/form/Create.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Create.vue', () => {
  const mockWindowConfirm = jest.spyOn(window, 'confirm');
  let store;
  const formActions = {
    resetForm: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          actions: formActions,
        },
      },
    });
  });

  afterEach(() => {
    mockWindowConfirm.mockReset();
    formActions.resetForm.mockReset();
  });

  afterAll(() => {
    mockWindowConfirm.mockRestore();
  });

  it('renders', () => {
    const wrapper = shallowMount(Create, {
      localVue,
      store,
      stubs: ['BaseSecure', 'BasePanel', 'FormDesigner', 'FormSettings', 'FormDisclaimer'],
    });

    expect(wrapper.html()).toMatch('basesecure');
    expect(formActions.resetForm).toHaveBeenCalledTimes(1);
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    const next = jest.fn();
    const wrapper = shallowMount(Create, {
      localVue,
      store,
      stubs: ['BaseSecure', 'BasePanel', 'FormDesigner', 'FormSettings', 'FormDisclaimer'],
    });
    Create.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(0);
  });
});
