// @vitest-environment happy-dom
// happy-dom is required to access window.confirm

import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFormStore } from '~/store/form';
import Create from '~/views/form/Create.vue';
import { IdentityMode } from '~/utils/constants';
import { nextTick } from 'vue';

describe('Create.vue', () => {
  const onFormLoad = vi.fn();
  const mockWindowConfirm = vi.spyOn(window, 'confirm');
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
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
          BaseStepper: {
            name: 'BaseStepper',
            template: '<div class="base-stepper-stub"><slot name="setUpForm" /><slot name="designForm" /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            methods: {
              onFormLoad,
            },
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
          BaseStepper: {
            name: 'BaseStepper',
            template: '<div class="base-stepper-stub"><slot name="setUpForm" /><slot name="designForm" /></div>',
          },
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            methods: {
              onFormLoad,
            },
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

  it('continue and back button works', async () => {
    const wrapper = mount(Create, {
      data() {
        return {
          creatorStep: 1,
          settingsFormValid: true,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseStepper: {
            name: 'BaseStepper',
            template: '<div class="base-stepper-stub"><slot name="setUpForm" /><slot name="designForm" /></div>',
          },
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            methods: {
              onFormLoad,
            },
            template: '<div class="form-designer-stub"><slot /></div>',
          },
          VForm: true,
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

    const continueBtn = wrapper.find('[data-test="continue-btn"]');
    expect(continueBtn.text()).toMatch('trans.create.continue');
    await continueBtn.trigger('click');
    await flushPromises();
    const backBtn = wrapper.find('[data-test="back-btn"]');
    expect(wrapper.html()).toMatch('form-designer');
    expect(backBtn.text()).toMatch('trans.create.back');
    await backBtn.trigger('click');
    await flushPromises();
    expect(wrapper.html()).toMatch('v-form-stub');
    expect(wrapper.html()).toMatch('trans.create.continue');
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    const next = vi.fn();
    const wrapper = mount(Create, {
      data() {
        return {
          creatorStep: 2,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseStepper: {
            name: 'BaseStepper',
            template: '<div class="base-stepper-stub"><slot name="setUpForm" /><slot name="designForm" /></div>',
          },
          FormSettings: {
            name: 'FormSettings',
            template: '<div class="form-settings-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: {
            name: 'FormDesigner',
            methods: {
              onFormLoad,
            },
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

    Create.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(0);
  });
});
