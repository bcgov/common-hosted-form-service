import { mount } from '@vue/test-utils';
import { describe, it } from 'vitest';
import { nextTick } from 'vue';
import { createTestingPinia } from '@pinia/testing';

import BaseDialog from '~/components/base/BaseDialog.vue';

describe('BaseDialog.vue', () => {
  it('renders with ok button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'OK',
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });
    await wrapper.vm.closeDialog();
    await nextTick();

    expect(wrapper.text()).toContain('trans.baseDialog.ok');
  });

  it('renders with continue button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'CONTINUE',
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('trans.baseDialog.continue');
    const continueBtn = wrapper.find('[data-test="continue-btn-continue"]');
    expect(continueBtn.exists()).toBeTruthy();
    await continueBtn.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('continue-dialog');
  });

  it('renders with the close button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        showCloseButton: true,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });

    expect(wrapper.find('i.mdi-close.v-icon').exists()).toBeTruthy();
  });

  it('renders without the close button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });

    expect(wrapper.find('i.mdi-close.v-icon').exists()).toBeFalsy();
  });

  it('renders SAVEDDELETE with delete button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'SAVEDDELETE',
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('trans.baseDialog.continue');
    const deleteBtn = wrapper.find('[data-test="saveddelete-btn-cancel"]');
    expect(deleteBtn.exists()).toBeTruthy();
    await deleteBtn.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('delete-dialog');
  });

  it('renders CUSTOM with custom button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'CUSTOM',
        enableCustomButton: true,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('trans.baseDialog.continue');
    const customBtn = wrapper.find('[data-test="custom-btn-custom"]');
    expect(customBtn.exists()).toBeTruthy();
    await customBtn.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('custom-dialog');
  });
});
