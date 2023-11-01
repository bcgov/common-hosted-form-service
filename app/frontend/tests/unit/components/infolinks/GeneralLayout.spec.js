// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { expect, vi } from 'vitest';

import getRouter from '~/router';
import GeneralLayout from '~/components/infolinks/GeneralLayout.vue';

describe('GeneralLayout.vue', () => {
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);

  it('onOpenDialog()', async () => {
    const getComponentSpy = vi.spyOn(GeneralLayout.methods, 'getComponent');
    const onDialogSpy = vi.spyOn(GeneralLayout.methods, 'onDialog');
    const wrapper = mount(GeneralLayout, {
      props: {
        componentsList: [
          { componentName: 'content', status: true },
          { componentName: 'textfiled', status: false },
        ],
        layoutList: [
          { componentName: 'content' },
          { componentName: 'textfiled' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });
    //wrapper.vm.onOpenDialog('Text Field');
    //expect(getComponentSpy).toHaveBeenCalledTimes(1);
    //expect(onDialogSpy).toHaveBeenCalledTimes(1);
  });

  it('onPreviewDialog()', async () => {
    const wrapper = mount(GeneralLayout, {
      props: {
        componentsList: [
          { componentName: 'content', status: true },
          { componentName: 'textfiled', status: false },
        ],
        layoutList: [
          { componentName: 'content' },
          { componentName: 'textfiled' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });
    //wrapper.vm.onPreviewDialog();
    //expect(wrapper.vm.showPreviewDialog).toBe(true);
  });

  it('onDialog()', async () => {
    const wrapper = mount(GeneralLayout, {
      props: {
        componentsList: [
          { componentName: 'content', status: true },
          { componentName: 'textfiled', status: false },
        ],
        layoutList: [
          { componentName: 'content' },
          { componentName: 'textfiled' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });
    //wrapper.vm.onDialog();
    //expect(wrapper.vm.showDialog).toBe(true);
  });
});
