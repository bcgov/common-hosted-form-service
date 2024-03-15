import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import BaseNotificationBar from '~/components/base/BaseNotificationBar.vue';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

describe('BaseNotificationBar.vue', () => {
  const notificationProperties = {
    text: 'Test Notification',
    ...NotificationTypes.ERROR,
  };

  it('notification is just a string', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(BaseNotificationBar, {
      props: {
        notification: {
          id: 1,
          consoleError: 'Hello',
        },
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await flushPromises();

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith('Hello');
  });

  it('notification is an object', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(BaseNotificationBar, {
      props: {
        notification: {
          id: 1,
          consoleError: {
            text: 'Just an object',
          },
        },
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await flushPromises();

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith('Just an object');
  });

  it('notification is an object with options', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(BaseNotificationBar, {
      props: {
        notification: {
          id: 1,
          consoleError: {
            text: 'Object with options',
            options: {
              to: 'nowhere',
            },
          },
        },
      },
      global: {
        plugins: [createTestingPinia()],
      },
    });

    await flushPromises();

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith('Object with options');
  });

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
