import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { expect, vi } from 'vitest';

import FormComponentsProactiveHelp from '~/components/admin/FormComponentsProactiveHelp.vue';
import { useAdminStore } from '~/store/admin';
import { FormComponentProactiveHelpValues } from '~/utils/constants';

describe('Dashboard.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);
  const listFCProactiveHelpSpy = vi.spyOn(adminStore, 'listFCProactiveHelp');
  listFCProactiveHelpSpy.mockImplementation(() => {});
  beforeEach(() => {
    adminStore.$reset();
    listFCProactiveHelpSpy.mockReset();
  });

  afterAll(() => {
    listFCProactiveHelpSpy.mockRestore();
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

    await flushPromises();

    expect(listFCProactiveHelpSpy).toHaveBeenCalledTimes(1);

    for (let [title] of Object.entries(FormComponentProactiveHelpValues)) {
      expect(wrapper.html()).toContain(title);
    }
  });

  it('extractGroupComponents should extract group components from FormComponentProactiveHelpValues', async () => {
    const wrapper = shallowMount(FormComponentsProactiveHelp, {
      global: {
        plugins: [pinia],
        stubs: {
          GeneralLayout: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.vm.extractGroupComponents('Basic Layout')).toEqual([
      {
        componentName: 'Text/Images',
      },
      {
        componentName: 'Columns - 2',
      },
      {
        componentName: 'Columns - 3',
      },
      {
        componentName: 'Columns - 4',
      },
      {
        componentName: 'Tabs',
      },
      {
        componentName: 'Panel',
      },
    ]);
  });
});
