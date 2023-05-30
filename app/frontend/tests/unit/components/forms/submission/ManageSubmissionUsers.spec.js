import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import ManageSubmissionUsers from '@/components/forms/submission/ManageSubmissionUsers.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ManageSubmissionUsers.vue', () => {
  const SUBMISSION_ID = '1111111111-1111-1111-111111111111';
  const mockFormGetter = jest.fn();
  let store;
  const formActions = {
    fetchDrafts: jest.fn(),
    fetchForm: jest.fn(),
    getFormPermissionsForUser: jest.fn(),
  };
  const notifactionActions = {
    addNotification: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            form: mockFormGetter,
          },
          actions: formActions,
        },
        notifications: {
          namespaced: true,
          actions: notifactionActions,
        },
      },
    });
  });

  afterEach(() => {
    mockFormGetter.mockReset();
  });

  it('renders', () => {
    mockFormGetter.mockReturnValue({ name: 'myForm' });
    const wrapper = shallowMount(ManageSubmissionUsers, {
      localVue,
      propsData: { isDraft: false, submissionId: SUBMISSION_ID },
      store,
      stubs: ['BaseDialog'],
    });

    expect(wrapper.html()).toMatch('Manage Team Members');
  });
});
