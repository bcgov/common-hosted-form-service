import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { VApp } from 'vuetify/components';
import BCGovAlertBanner from '~/components/bcgov/BCGovAlertBanner.vue';
import getRouter from '~/router';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

describe('BCGovAlertBanner.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  it('renders default error', async () => {
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(VApp, {
      global: {
        plugins: [router],
      },
      slots: {
        default: h(BCGovAlertBanner),
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.html()).toContain('defaultErrMsg');
  });

  it('renders with a custom error message', async () => {
    const message = 'This is a custom error message for testing.';
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
      },
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with an info message', async () => {
    const message = 'This is a custom info message for testing.';
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
        type: 'info',
      },
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.INFO.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with a success message', async () => {
    const message = 'This is a custom success message for testing.';
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
        type: 'success',
      },
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.SUCCESS.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with a warning message', async () => {
    const message = 'This is a custom warning message for testing.';
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
        type: 'warning',
      },
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.WARNING.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders ok with the default if type is wrong', async () => {
    const message = 'This is a custom warning message for testing.';
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
        type: 'BROKEN',
      },
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders html without escaping it', async () => {
    const message = 'This is a <a href="a">custom<a/> warning message..';
    const authStore = useAuthStore(pinia);
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
        type: 'BROKEN',
      },
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.text()).not.toContain('href');
  });

  it('deletes the notification', async () => {
    const message = 'This is a <a href="a">custom<a/> warning message..';
    const authStore = useAuthStore(pinia);
    const notificationStore = useNotificationStore(pinia);

    authStore.authenticated = true;
    authStore.ready = true;

    const notification = {
      id: 1,
      text: message,
      ...NotificationTypes.ERROR,
    };

    notificationStore.notifications = [notification];

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        id: 1,
        text: message,
        type: 'warning',
      },
      global: {
        plugins: [router],
      },
    });

    await flushPromises();

    wrapper.vm.onClose();

    expect(notificationStore.notifications.length).toBe(0);
  });
});
