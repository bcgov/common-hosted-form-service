import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import Manage from '@/views/form/Manage.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Manage.vue', () => {
  const mockFormGetter = jest.fn();
  let store;
  const formActions = {
    fetchDrafts: jest.fn(),
    fetchForm: jest.fn(),
    getFormPermissionsForUser: jest.fn()
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            form: mockFormGetter
          },
          actions: formActions
        }
      }
    });
  });

  afterEach(() => {
    mockFormGetter.mockReset();
  });

  it('renders', () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    const wrapper = shallowMount(Manage, {
      localVue,
      propsData: { f: 'f' },
      store,
      stubs: ['BaseSecure', 'ManageFormActions', 'ManageForm']
    });

    expect(wrapper.html()).toMatch('basesecure');
  });

  it('calls the store actions', () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    const formId = '123-456';
    shallowMount(Manage, {
      localVue,
      propsData: { f: formId },
      store,
      stubs: ['BaseSecure', 'ManageFormActions', 'ManageForm']
    });

    expect(formActions.fetchDrafts).toHaveBeenCalledTimes(1);
    expect(formActions.fetchForm).toHaveBeenCalledTimes(1);
    expect(formActions.getFormPermissionsForUser).toHaveBeenCalledTimes(1);
  });

  it('shows the form name', () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    const wrapper = shallowMount(Manage, {
      localVue,
      propsData: { f: 'f' },
      store,
      stubs: ['BaseSecure', 'ManageFormActions', 'ManageForm']
    });

    expect(wrapper.html()).toMatch('myForm');
  });
});
