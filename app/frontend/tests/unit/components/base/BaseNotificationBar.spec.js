import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import BaseNotificationBar from '@/components/base/BaseNotificationBar.vue';

const localVue = createLocalVue();
localVue.use(Vuex);


describe('BaseNotificationBar.vue', () => {
  let mockDeleteNotification = jest.fn();
  let store;
  const notificationProperties = {
    type: 'error',
    class: 'alert-error',
    color: '#f2dede',
    icon: 'error',
    message: 'test',
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        notifications: {
          namespaced: true,
          actions: {
            deleteNotification: mockDeleteNotification,
          },
        },
      },
    });
  });

  afterEach(() => {
    mockDeleteNotification.mockClear();
  });

  it('renders', () => {
    const wrapper = shallowMount(BaseNotificationBar, {
      localVue,
      propsData: {
        notification: {
          ...notificationProperties,
        },
      },
      store,
      i18n
    });

    expect(wrapper.html()).toMatch('v-alert');
    expect(wrapper.text()).toMatch(notificationProperties.message);
  });

  it('alertClosed behaves correctly', () => {
    const wrapper = shallowMount(BaseNotificationBar, {
      localVue,
      propsData: {
        notification: {
          ...notificationProperties,
        },
      },
      store,
      i18n
    });
    wrapper.vm.alertClosed();

    expect(mockDeleteNotification).toHaveBeenCalledTimes(1);
  });

  it('clears timeout before destroy', () => {
    const wrapper = shallowMount(BaseNotificationBar, {
      localVue,
      propsData: {
        notification: {
          ...notificationProperties,
        },
      },
      store,
      i18n
    });
    wrapper.destroy();

    expect(wrapper.vm.timeout).not.toBeNull();
  });
});
