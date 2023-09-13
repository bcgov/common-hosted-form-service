import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { expect, vi } from 'vitest';

import FormComponentsProactiveHelp from '~/components/admin/FormComponentsProactiveHelp.vue';

describe('Dashboard.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const extractGroupComponentsSpy = vi.spyOn(
    FormComponentsProactiveHelp.methods,
    'extractGroupComponents'
  );
  beforeEach(() => {
    extractGroupComponentsSpy.mockReset();
  });

  afterAll(() => {
    extractGroupComponentsSpy.mockRestore();
  });

  it('renders', async () => {
    const wrapper = mount(FormComponentsProactiveHelp, {
      global: {
        plugins: [pinia],
        stubs: {
          GeneralLayout: true,
        },
      },
    });

    wrapper.vm.onExpansionPanelClick('Basic Layout');
    expect(extractGroupComponentsSpy).toHaveBeenCalledTimes(1);
  });
});
