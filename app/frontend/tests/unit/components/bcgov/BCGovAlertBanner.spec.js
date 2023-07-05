// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { VApp } from 'vuetify/components';
import BCGovAlertBanner from '~/components/bcgov/BCGovAlertBanner.vue';
import getRouter from '~/router';
import { useAuthStore } from '~/store/auth';
import { NotificationTypes } from '~/utils/constants';

describe('BCGovAlertBanner.vue', () => {
  setActivePinia(createPinia());
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  it('renders default error', async () => {
    const authStore = useAuthStore();
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

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.html()).toContain('Error');
  });

  it('renders with a custom error message', async () => {
    const message = 'This is a custom error message for testing.';
    const authStore = useAuthStore();
    authStore.authenticated = true;
    authStore.ready = true;

    const wrapper = mount(BCGovAlertBanner, {
      props: {
        text: message,
      },
      global: {
        plugins: [router],
      },
    });

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with an info message', async () => {
    const message = 'This is a custom info message for testing.';
    const authStore = useAuthStore();
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

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.INFO.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with a success message', async () => {
    const message = 'This is a custom success message for testing.';
    const authStore = useAuthStore();
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

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.SUCCESS.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with a warning message', async () => {
    const message = 'This is a custom warning message for testing.';
    const authStore = useAuthStore();
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

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.WARNING.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders ok with the default if type is wrong', async () => {
    const message = 'This is a custom warning message for testing.';
    const authStore = useAuthStore();
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

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders html without escaping it', async () => {
    const message = 'This is a <a href="a">custom<a/> warning message..';
    const authStore = useAuthStore();
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

    await nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.type);
    expect(wrapper.text()).not.toContain('href');
  });
});
