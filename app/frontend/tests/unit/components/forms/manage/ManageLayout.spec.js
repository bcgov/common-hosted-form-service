import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import ManageLayout from '@/components/forms/manage/ManageLayout.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ManageLayout.vue', () => {
  const mockFormGetter = jest.fn();
  const mockPermissionsGetter = jest.fn();
  let store;
  const formActions = {
    fetchDrafts: jest.fn(),
    fetchForm: jest.fn(),
    getFormPermissionsForUser: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            form: mockFormGetter,
            permissions: mockPermissionsGetter,
          },
          actions: formActions,
        },
      },
    });
  });

  afterEach(() => {
    mockFormGetter.mockReset();
    mockPermissionsGetter.mockReset();
  });

  it('renders', () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    mockPermissionsGetter.mockReturnValue(['design_read']);
    const wrapper = shallowMount(ManageLayout, {
      localVue,
      propsData: { f: 'f' },
      store,
      stubs: ['ManageFormActions', 'ManageForm'],
    });

    expect(wrapper.html()).toMatch('Manage Form');
  });

  it('calls the store actions', async () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    mockPermissionsGetter.mockReturnValue(['design_read']);
    const formId = '123-456';
    await shallowMount(ManageLayout, {
      localVue,
      propsData: { f: formId },
      store,
      stubs: ['ManageFormActions', 'ManageForm'],
    });

    expect(formActions.fetchForm).toHaveBeenCalledTimes(1);
    expect(formActions.getFormPermissionsForUser).toHaveBeenCalledTimes(1);
  });

  it('shows the form name', () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    mockPermissionsGetter.mockReturnValue(['design_read']);
    const wrapper = shallowMount(ManageLayout, {
      localVue,
      propsData: { f: 'f' },
      store,
      stubs: ['ManageFormActions', 'ManageForm'],
    });

    expect(wrapper.html()).toMatch('myForm');
  });
});
