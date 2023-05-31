import { createLocalVue, shallowMount } from '@vue/test-utils';
import AddOwner from '@/components/admin/AddOwner.vue';
import Vuex from 'vuex';
import i18n from '@/internationalization';

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
      i18n,
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

    expect(wrapper.text()).toMatch('Add owner');
  });
});
