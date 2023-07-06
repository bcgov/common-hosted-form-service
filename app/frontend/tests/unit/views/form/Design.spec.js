// @vitest-environment happy-dom
// happy-dom is required to access window.confirm

import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useFormStore } from '~/store/form';
import Design from '~/views/form/Design.vue';

describe('Design.vue', () => {
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

  it('renders', async () => {
    const wrapper = mount(Design, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormDesigner: true,
        },
      },
    });

    vi.spyOn(wrapper.vm, 'onFormLoad').mockImplementation(() => {});

    expect(wrapper.html()).toMatch('base-secure');
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    const next = vi.fn();
    formStore.form = {
      isDirty: false,
    };
    const wrapper = mount(Design, {
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
          FormDesigner: true,
        },
      },
    });

    vi.spyOn(wrapper.vm, 'onFormLoad').mockImplementation(() => {});

    Design.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(0);
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    const next = vi.fn();
    formStore.form = {
      isDirty: true,
    };
    const wrapper = mount(Design, {
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
          FormDesigner: true,
        },
      },
    });

    vi.spyOn(wrapper.vm, 'onFormLoad').mockImplementation(() => {});

    Design.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(1);
  });
});
