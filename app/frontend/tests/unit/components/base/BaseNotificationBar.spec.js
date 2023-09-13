import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import BaseNotificationBar from '~/components/base/BaseNotificationBar.vue';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

describe('BaseNotificationBar.vue', () => {
  const notificationProperties = {
    text: 'Test Notification',
    ...NotificationTypes.ERROR,
  };

  it('renders', async () => {
    const wrapper = mount(BaseNotificationBar, {
      props: {
        notification: {
          id: 1,
          ...notificationProperties,
        },
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    expect(wrapper.html()).toMatch('v-alert');
    expect(wrapper.text()).toMatch(notificationProperties.text);
  });

  it('alertClosed behaves correctly', async () => {
    const wrapper = mount(BaseNotificationBar, {
      props: {
        notification: {
          id: 1,
          ...notificationProperties,
        },
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });
    const store = useNotificationStore();
    const deleteNotificationSpy = vi.spyOn(store, 'deleteNotification');

    wrapper.vm.alertClosed();
    expect(deleteNotificationSpy).toHaveBeenCalledTimes(1);
  });

  it('clears timeout before destroy', async () => {
    const wrapper = mount(BaseNotificationBar, {
      props: {
        notification: {
          id: 1,
          timeout: 1,
          ...notificationProperties,
        },
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    wrapper.unmount();

    expect(wrapper.vm.timeout).not.toBeNull();
  });
});
