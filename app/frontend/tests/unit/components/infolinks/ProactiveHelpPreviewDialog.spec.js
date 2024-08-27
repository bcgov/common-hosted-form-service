import { mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { expect } from 'vitest';

import getRouter from '~/router';
import ProactiveHelpPreviewDialog from '~/components/infolinks/ProactiveHelpPreviewDialog.vue';

describe('ProactiveHelpPreviewDialog.vue', () => {
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(ProactiveHelpPreviewDialog, {
      props: {
        component: {
          componentName: 'content',
          description: 'dump description',
          imageUrl: 'https://dumpurl.com',
          moreHelpInfoLink: 'https://dumpurl.com',
        },
        showDialog: true,
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('content').toContain('dump description');
  });

  it('onCloseDialog should emit close-dialog', () => {
    const wrapper = shallowMount(ProactiveHelpPreviewDialog, {
      props: {
        component: {
          componentName: 'content',
          description: 'dump description',
          imageUrl: 'https://dumpurl.com',
          moreHelpInfoLink: 'https://dumpurl.com',
        },
        showDialog: true,
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.onCloseDialog();
    expect(wrapper.emitted()).toHaveProperty('close-dialog');
  });
});
