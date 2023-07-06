// @vitest-environment happy-dom
// happy-dom is required to access window.confirm

import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useFormStore } from '~/store/form';
import Create from '~/views/form/Create.vue';

describe('Create.vue', () => {
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
    const wrapper = mount(Create, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSettings: true,
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.html()).toMatch('trans.create.createNewForm');
    expect(wrapper.html()).toMatch('form-settings');
    expect(wrapper.html()).toMatch('form-disclaimer');
    expect(wrapper.find('button').text()).toMatch('trans.create.continue');
  });

  it('renders second page', async () => {
    const wrapper = mount(Create, {
      data() {
        return {
          step: 2,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSettings: true,
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: true,
        },
      },
    });

    vi.spyOn(wrapper.vm, 'onFormLoad').mockImplementation(() => {});

    await nextTick();

    expect(wrapper.html()).toMatch('trans.create.createNewForm');
    expect(wrapper.html()).toMatch('form-designer');
    expect(wrapper.find('button').text()).toMatch('trans.create.back');
  });

  it('continue and back button works', async () => {
    const wrapper = mount(Create, {
      data() {
        return {
          step: 1,
          settingsFormValid: true,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSettings: true,
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: true,
          VForm: true,
        },
      },
    });

    await nextTick();

    const continueBtn = wrapper.find('[data-test="continue-btn"]');
    expect(continueBtn.text()).toMatch('trans.create.continue');
    await continueBtn.trigger('click');
    await nextTick();
    const backBtn = wrapper.find('[data-test="back-btn"]');
    expect(wrapper.html()).toMatch('form-designer');
    expect(backBtn.text()).toMatch('trans.create.back');
    await backBtn.trigger('click');
    await nextTick();
    expect(wrapper.html()).toMatch('v-form-stub');
    expect(wrapper.html()).toMatch('trans.create.continue');
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    const next = vi.fn();
    const wrapper = mount(Create, {
      data() {
        return {
          step: 2,
        };
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSettings: true,
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
          FormDisclaimer: true,
          FormDesigner: true,
        },
      },
    });

    vi.spyOn(wrapper.vm, 'onFormLoad').mockImplementation(() => {});

    Create.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(0);
  });
});
