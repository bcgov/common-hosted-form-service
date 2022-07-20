import { createLocalVue, shallowMount } from '@vue/test-utils';
import AdministerForm from '@/components/admin/AdministerForm.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('AdministerForm.vue', () => {
  const mockAdminGetter = jest.fn();
  const mockRolesGetter = jest.fn();
  const mockApiKey = jest.fn();
  let store;
  const actions = {
    readForm: jest.fn(),
    restoreForm: jest.fn(),
    readRoles: jest.fn(),
    readApiDetails: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        admin: {
          namespaced: true,
          getters: {
            apiKey: mockApiKey,
            form: mockAdminGetter,
            roles: mockRolesGetter,
          },
          actions: actions
        }
      }
    });
  });

  afterEach(() => {
    mockAdminGetter.mockReset();
    mockRolesGetter.mockReset();
    actions.readForm.mockReset();
    actions.readRoles.mockReset();
    actions.restoreForm.mockReset();
  });

  it('renders ', async () => {
    mockAdminGetter.mockReturnValue({ name: 'tehForm' });
    mockRolesGetter.mockReturnValue(['admin']);
    const wrapper = shallowMount(AdministerForm, {
      localVue,
      store,
      propsData: { formId: 'f' },
      stubs: ['BaseDialog', 'AdminVersions', 'VueJsonPretty']
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('tehForm');
    expect(actions.readForm).toHaveBeenCalledTimes(1);
  });
});
