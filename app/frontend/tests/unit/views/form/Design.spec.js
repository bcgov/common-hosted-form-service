// @vitest-environment happy-dom
// happy-dom is required to access window.confirm

import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFormStore } from '~/store/form';
import Design from '~/views/form/Design.vue';

vi.mock('vue-router', () => ({
  ...vi.importActual('vue-router'),
  onBeforeRouteLeave: vi.fn(),
}));

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
          FormDesigner: {
            name: 'FormDesigner',
            template: '<div class="form-designer-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.html()).toMatch('v-stepper');
  });
});
