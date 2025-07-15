import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, it } from 'vitest';
import { nextTick } from 'vue';
import { createTestingPinia } from '@pinia/testing';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';

describe('BaseDialog.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore();
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders with ok button', async () => {
    formStore.isRTL = true;
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'OK',
      },
      global: {
        plugins: [pinia],
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
    expect(wrapper.vm.RTL).toBe('ml-5');
  });

  it('renders with continue button', async () => {
    formStore.isRTL = false;
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'CONTINUE',
      },
      global: {
        plugins: [pinia],
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

    await flushPromises();

    expect(wrapper.vm.RTL).toBe('mr-5');
  });

  it('renders with the close button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        showCloseButton: true,
      },
      global: {
        plugins: [pinia],
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
        plugins: [pinia],
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
        plugins: [pinia],
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
        plugins: [pinia],
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
