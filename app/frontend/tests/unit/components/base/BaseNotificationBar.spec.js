import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import BaseNotificationBar from '@/components/base/BaseNotificationBar.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('BaseNotificationBar.vue', () => {
  let mockDeleteNotification = jest.fn();
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        notifications: {
          namespaced: true,
          actions: {
            deleteNotification: mockDeleteNotification
          }
        }
      }
    });
  });

  afterEach(() => {
    mockDeleteNotification.mockClear();
  });

  it('renders', () => {
    const msg = 'test';
    const wrapper = shallowMount(BaseNotificationBar, {
      localVue,
      propsData: { notification: { message: msg, type: 'error' } },
      store
    });

    expect(wrapper.html()).toMatch('v-alert');
    expect(wrapper.text()).toMatch(msg);
  });

  it('alertClosed behaves correctly', () => {
    const wrapper = shallowMount(BaseNotificationBar, {
      localVue,
      propsData: { notification: { message: 'test', type: 'error' } },
      store
    });
    wrapper.vm.alertClosed();

    expect(mockDeleteNotification).toHaveBeenCalledTimes(1);
  });

  it('clears timeout before destroy', () => {
    const wrapper = shallowMount(BaseNotificationBar, {
      localVue,
      propsData: { notification: { message: 'test', type: 'error' } },
      store
    });
    wrapper.destroy();

    expect(wrapper.vm.timeout).not.toBeNull();
  });
});
