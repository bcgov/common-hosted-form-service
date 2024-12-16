// @vitest-environment happy-dom
// happy-dom is required to access window.confirm

import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as VueRouter from 'vue-router';

import { useFormStore } from '~/store/form';
import Create from '~/views/form/Create.vue';
import { IdentityMode } from '~/utils/constants';
import { nextTick } from 'vue';
import { useAppStore } from '~/store/app';

vi.mock('vue-router', () => ({
  ...vi.importActual('vue-router'),
  onBeforeRouteLeave: vi.fn(),
}));

describe('Create.vue', () => {
  const onBeforeRouteLeaveSpy = vi.spyOn(VueRouter, 'onBeforeRouteLeave');
  const mockWindowConfirm = vi.spyOn(window, 'confirm');
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(async () => {
    formStore.$reset();
    appStore.$reset();
    mockWindowConfirm.mockReset();
  });

  afterAll(() => {
    mockWindowConfirm.mockRestore();
  });

  it('renders first page', async () => {
    formStore.form = {
      userType: IdentityMode.TEAM,
    };
    const wrapper = mount(Create, {
      global: {
        plugins: [pinia],
        stubs: {
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            template: '<div class="form-designer-stub"><slot /></div>',
          },
          VForm: {
            name: 'VForm',
            template: '<div class="v-form-stub"><slot /></div>',
          },
          VStepper: {
            name: 'VStepper',
            template: '<div class="v-stepper-stub"><slot /></div>',
          },
          VStepperWindow: {
            name: 'VStepperWindow',
            template: '<div class="v-stepper-window-stub"><slot /></div>',
          },
          VStepperHeader: {
            name: 'VStepperHeader',
            template: '<div class="v-stepper-header-stub"><slot /></div>',
          },
          VStepperWindowItem: {
            name: 'VStepperWindowItem',
            template: '<div class="v-stepper-window-item-stub"><slot /></div>',
          },
          VStepperItem: {
            name: 'VStepperItem',
            template: '<div class="v-stepper-item-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.html()).toMatch('form-settings');
    expect(wrapper.html()).toMatch('form-disclaimer');
    expect(wrapper.find('button').text()).toMatch('trans.create.continue');

    formStore.$patch({
      form: {
        userType: IdentityMode.LOGIN,
      },
    });

    await nextTick();
  });

  it('renders second page', async () => {
    const wrapper = mount(Create, {
      data() {
        return {
          creatorStep: 2,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            template: '<div class="form-designer-stub"><slot /></div>',
          },
          VStepper: {
            name: 'VStepper',
            template: '<div class="v-stepper-stub"><slot /></div>',
          },
          VStepperWindow: {
            name: 'VStepperWindow',
            template: '<div class="v-stepper-window-stub"><slot /></div>',
          },
          VStepperHeader: {
            name: 'VStepperHeader',
            template: '<div class="v-stepper-header-stub"><slot /></div>',
          },
          VStepperWindowItem: {
            name: 'VStepperWindowItem',
            template: '<div class="v-stepper-window-item-stub"><slot /></div>',
          },
          VStepperItem: {
            name: 'VStepperItem',
            template: '<div class="v-stepper-item-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.html()).toMatch('form-designer');
    expect(wrapper.find('button').text()).toMatch('trans.create.continue');
  });

  it('beforeRouteLeave guard works when not dirty', async () => {
    const onBeforeRouteLeaveMock = onBeforeRouteLeaveSpy.mockImplementationOnce(
      () => {}
    );
    mount(Create, {
      data() {
        return {
          creatorStep: 2,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            template: '<div class="form-designer-stub"><slot /></div>',
          },
          VStepper: {
            name: 'VStepper',
            template: '<div class="v-stepper-stub"><slot /></div>',
          },
          VStepperWindow: {
            name: 'VStepperWindow',
            template: '<div class="v-stepper-window-stub"><slot /></div>',
          },
          VStepperHeader: {
            name: 'VStepperHeader',
            template: '<div class="v-stepper-header-stub"><slot /></div>',
          },
          VStepperWindowItem: {
            name: 'VStepperWindowItem',
            template: '<div class="v-stepper-window-item-stub"><slot /></div>',
          },
          VStepperItem: {
            name: 'VStepperItem',
            template: '<div class="v-stepper-item-stub"><slot /></div>',
          },
        },
      },
    });

    expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(0);
  });

  it('beforeRouteLeave guard does not work when dirty', async () => {
    formStore.form = {
      isDirty: true,
    };
    const onBeforeRouteLeaveMock = onBeforeRouteLeaveSpy.mockImplementationOnce(
      () => {
        if (formStore.form.isDirty) {
          window.confirm('do something');
        }
      }
    );
    mount(Create, {
      data() {
        return {
          creatorStep: 2,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            template: '<div class="form-designer-stub"><slot /></div>',
          },
          VStepper: {
            name: 'VStepper',
            template: '<div class="v-stepper-stub"><slot /></div>',
          },
          VStepperWindow: {
            name: 'VStepperWindow',
            template: '<div class="v-stepper-window-stub"><slot /></div>',
          },
          VStepperHeader: {
            name: 'VStepperHeader',
            template: '<div class="v-stepper-header-stub"><slot /></div>',
          },
          VStepperWindowItem: {
            name: 'VStepperWindowItem',
            template: '<div class="v-stepper-window-item-stub"><slot /></div>',
          },
          VStepperItem: {
            name: 'VStepperItem',
            template: '<div class="v-stepper-item-stub"><slot /></div>',
          },
        },
      },
    });

    expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(1);
  });
});
