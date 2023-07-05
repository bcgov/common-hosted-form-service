import { mount } from '@vue/test-utils';
import { describe, it } from 'vitest';
import { nextTick } from 'vue';

import BaseDialog from '~/components/base/BaseDialog.vue';

describe('BaseDialog.vue', () => {
  it('renders with ok button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        type: 'OK',
      },
      global: {
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
  });

  it('renders with the close button', async () => {
    const wrapper = mount(BaseDialog, {
      props: {
        modelValue: true,
        showCloseButton: true,
      },
      global: {
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
});
