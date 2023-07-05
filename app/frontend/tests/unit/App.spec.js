import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import App from '~/App.vue';
import getRouter from '~/router';

describe('App.vue', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  it('renders', () => {
    const wrapper = shallowMount(App, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('v-layout-stub').exists()).toBeTruthy();
    expect(wrapper.text()).toMatch('');
  });
});
