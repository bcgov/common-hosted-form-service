import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import { rbacService } from '~/services';
import getRouter from '~/router';
import ProactiveHelpPreviewDialog from '~/components/infolinks/ProactiveHelpPreviewDialog.vue';
import { useFormStore } from '~/store/form';

describe('ProactiveHelpPreviewDialog.vue', () => {
  const getSubmissionUsersSpy = vi.spyOn(rbacService, 'getSubmissionUsers');
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    getSubmissionUsersSpy.mockReset();
    formStore.$reset();
  });

  afterAll(() => {
    getSubmissionUsersSpy.mockRestore();
  });

  it('renders', () => {
    formStore.form.name = 'myForm';
    getSubmissionUsersSpy.mockImplementation(() => ({ data: [] }));
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
});
