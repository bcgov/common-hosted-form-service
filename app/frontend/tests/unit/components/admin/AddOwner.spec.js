import { createLocalVue, shallowMount } from '@vue/test-utils';
import AddOwner from '@/components/admin/AddOwner.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('AddOwner.vue', () => {
  const mockAdminGetter = jest.fn();
  let store;
  const actions = {
    readUser: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        admin: {
          namespaced: true,
          getters: {
            user: mockAdminGetter,
          },
          actions: actions,
        },
      },
    });
  });

  it('renders ', async () => {
    const wrapper = shallowMount(AddOwner, {
      localVue,
      store,
      propsData: { formId: 'f' },
      mocks: {
        $config: {
          keycloak: {
            serverUrl: 'servU',
            realm: 'theRealm',
          },
        },
      },
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('This should only be done');
  });
});
