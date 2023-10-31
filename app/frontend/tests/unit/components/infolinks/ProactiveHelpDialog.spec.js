// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { expect, vi } from 'vitest';
import { nextTick } from 'vue';

import getRouter from '~/router';
import ProactiveHelpDialog from '~/components/infolinks/ProactiveHelpDialog.vue';

describe('ProactiveHelpDialog.vue', () => {
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);

  it('resetDialog', async () => {
    const wrapper = mount(ProactiveHelpDialog, {
      props: {
        component: {
          componentName: 'content',
          description: 'dump text',
          imageUrl: 'https://dumpurl.com',
          moreHelpInfoLink: 'https://dumpurl.com',
        },
        groupName: 'test',
        showDialog: true,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.resetDialog();
    await nextTick();
    expect(wrapper.vm.description).toBe('');
  });
});
