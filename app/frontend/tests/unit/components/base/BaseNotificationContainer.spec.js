import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import BaseNotificationContainer from '@/components/base/BaseNotificationContainer.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BaseNotificationContainer.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        notifications: {
          namespaced: true,
          state: {
            notifications: [],
          },
        },
      },
    });
  });

  it('renders', () => {
    const wrapper = shallowMount(BaseNotificationContainer, {
      localVue,
      store,
      stubs: ['BaseNotificationBar'],
      i18n
    });

    expect(wrapper.html()).toMatch('notification-container');
  });
});
