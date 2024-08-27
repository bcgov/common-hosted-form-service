// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { expect, vi } from 'vitest';

import getRouter from '~/router';
import ProactiveHelpDialog from '~/components/infolinks/ProactiveHelpDialog.vue';
import { useAdminStore } from '~/store/admin';

const STUBS = {
  VRow: {
    template: '<div class="v-row-stub"><slot /></div>',
  },
  VCol: {
    template: '<div class="v-col-stub"><slot /></div>',
  },
  VDialog: {
    template: '<div class="v-dialog-stub"><slot /></div>',
  },
  VCard: {
    template: '<div class="v-card-stub"><slot /></div>',
  },
  VContainer: {
    template: '<div class="v-container-stub"><slot /></div>',
  },
  VTextField: {
    template: '<div class="v-text-field-stub"><slot /></div>',
  },
  VCheckbox: {
    template: '<div class="v-checkbox-stub"><slot /></div>',
  },
  VTextArea: {
    template: '<div class="v-text-area-stub"><slot /></div>',
  },
  VIcon: {
    template: '<div class="v-icon-stub"><slot /></div>',
  },
  VFileInput: {
    template: '<div class="v-file-input-stub"><slot /></div>',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
};

describe('ProactiveHelpDialog.vue', () => {
  const pinia = createTestingPinia();
  const adminStore = useAdminStore(pinia);
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);

  it('renders', async () => {
    const wrapper = mount(ProactiveHelpDialog, {
      props: {
        component: {
          componentName: 'content',
          description: 'dump text',
          imageUrl: 'https://dumpurl.com',
          moreHelpInfoLink: 'https://dumpurl.com',
        },
        componentName: 'content',
        groupName: 'test',
        showDialog: true,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('content');
  });

  it('rules should return largeImgTxt if it fails', () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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

    expect(wrapper.vm.rules[0]([{ size: 5000000 }])).toEqual(
      'trans.proactiveHelpDialog.largeImgTxt'
    );
  });

  it('onCloseDialog should call resetDialog and emit close-dialog', () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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

    wrapper.vm.onCloseDialog();
    expect(wrapper.emitted()).toHaveProperty('close-dialog');
  });

  it('validateLinkUrl should return true and set linkError to true if isLinkEnabled and moreHelpInfoLink is blank otherwise false', () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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

    expect(wrapper.vm.validateLinkUrl()).toBeFalsy();
    expect(wrapper.vm.linkError).toBeFalsy();
    wrapper.vm.isLinkEnabled = true;
    wrapper.vm.moreHelpInfoLink = '';
    expect(wrapper.vm.validateLinkUrl()).toBeTruthy();
    expect(wrapper.vm.linkError).toBeTruthy();
  });

  it('selectImage will set imageSizeError to true if the image size is too large', async () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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

    wrapper.vm.files = [{ size: 50000000 }];
    await wrapper.vm.selectImage();
    expect(wrapper.vm.imageSizeError).toBeTruthy();
  });

  it('selectImage will set imageSizeError to true if the image size is too large', async () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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

    window.FileReader = function () {
      this.readAsDataURL = vi.fn();
      this.onerror = null;
    };

    wrapper.vm.files = [{ size: 1 }];

    await wrapper.vm.selectImage();
    expect(wrapper.vm.imageSizeError).toBeFalsy();
  });

  it('submit will call addFCProactiveHelp then emit close-dialog', async () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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

    const addFCProactiveHelpSpy = vi.spyOn(adminStore, 'addFCProactiveHelp');
    addFCProactiveHelpSpy.mockImplementation(() => {});

    await wrapper.vm.submit();

    expect(addFCProactiveHelpSpy).toBeCalledTimes(1);
    expect(wrapper.emitted()).toHaveProperty('close-dialog');
  });

  it('resetDialog', async () => {
    const wrapper = shallowMount(ProactiveHelpDialog, {
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
    expect(wrapper.vm.description).toBe('');
  });
});
