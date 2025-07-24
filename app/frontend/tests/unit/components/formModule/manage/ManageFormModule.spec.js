import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import ManageFormModule from '~/components/formModule/manage/ManageFormModule.vue';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

describe('ManageFormModule.vue', () => {
  let wrapper;
  let formModuleStore;
  let notificationStore;

  const mockFormModule = {
    id: 'test-module-123',
    name: 'Test Form Module',
    description: 'A test form module',
    active: true,
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: 'test-user',
    formModuleVersions: [
      {
        id: 'v1',
        externalUris: ['uri1'],
        config: {},
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 'v2',
        externalUris: ['uri2'],
        config: {},
        createdAt: '2023-01-02T00:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    // Create a fresh Pinia for each test
    const pinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);

    formModuleStore = useFormModuleStore();
    notificationStore = useNotificationStore();

    // Mock the formModule ref in the store
    formModuleStore.formModule = ref({ ...mockFormModule });
  });

  it('renders the component with form module information', async () => {
    wrapper = mount(ManageFormModule, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          FormModuleSettings: true,
          ManageFormModuleVersions: true,
        },
      },
    });

    await flushPromises();

    // Check if form module settings title is rendered
    expect(wrapper.text()).toContain(
      'trans.manageFormModule.formModuleSettings'
    );

    // Check if creation info is rendered
    expect(wrapper.text()).toContain(
      'trans.manageFormModule.formModuleCreated'
    );

    // Check if versions section is rendered
    expect(wrapper.text()).toContain(
      'trans.manageFormModule.formModuleVersions'
    );

    // Check if version count is displayed correctly
    expect(wrapper.text()).toContain('trans.manageFormModule.totalVersions');
  });

  it('calculates version count correctly', async () => {
    // Create a single Pinia instance
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    // Get stores from this instance
    const testFormModuleStore = useFormModuleStore(pinia);

    // Mock the formModule ref in the store
    testFormModuleStore.formModule = ref({ ...mockFormModule });

    wrapper = mount(ManageFormModule, {
      global: {
        plugins: [pinia], // Use the same Pinia instance
        stubs: {
          FormModuleSettings: true,
          ManageFormModuleVersions: true,
        },
      },
    });

    await flushPromises();
    expect(wrapper.vm.versionCount).toBe(2);

    // Update in the same store instance
    testFormModuleStore.formModule = {
      ...mockFormModule,
      formModuleVersions: [],
    };
    await flushPromises();
    expect(wrapper.vm.versionCount).toBe(0);
  });

  it('calls updateFormModule when settings are updated successfully', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
    setActivePinia(pinia);
    formModuleStore = useFormModuleStore(pinia);
    notificationStore = useNotificationStore(pinia);
    wrapper = mount(ManageFormModule, {
      global: {
        plugins: [pinia],
        stubs: {
          FormModuleSettings: true,
          ManageFormModuleVersions: true,
        },
      },
    });

    const updateFormModuleSpy = vi
      .spyOn(formModuleStore, 'updateFormModule')
      .mockImplementationOnce(() => {});
    const fetchFormModuleSpy = vi
      .spyOn(formModuleStore, 'fetchFormModule')
      .mockImplementationOnce(() => {});

    // Mock the form validation to succeed
    wrapper.vm.settingsFormModule = { validate: () => true };

    formModuleStore.formModule = { id: mockFormModule.id };

    await wrapper.vm.updateSettings();
    await flushPromises();

    // Check if store methods were called
    expect(updateFormModuleSpy).toHaveBeenCalledTimes(1);
    expect(fetchFormModuleSpy).toHaveBeenCalledWith(mockFormModule.id);

    // Check if success notification was added
    expect(notificationStore.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          'trans.manageFormModule.updateFormModuleSuccess'
        ),
        ...NotificationTypes.SUCCESS,
      })
    );
  });

  it('does not call updateFormModule when validation fails', async () => {
    wrapper = mount(ManageFormModule, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          FormModuleSettings: true,
          ManageFormModuleVersions: true,
        },
      },
    });

    // Mock the form validation to fail
    wrapper.vm.settingsFormModule = { validate: () => false };

    await wrapper.find('button').trigger('click');
    await flushPromises();

    // Check that store methods were not called
    expect(formModuleStore.updateFormModule).not.toHaveBeenCalled();
    expect(formModuleStore.fetchFormModule).not.toHaveBeenCalled();
    expect(notificationStore.addNotification).not.toHaveBeenCalled();
  });

  it('shows error notification when update fails', async () => {
    const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
    setActivePinia(pinia);
    formModuleStore = useFormModuleStore(pinia);
    notificationStore = useNotificationStore(pinia);

    // Mock the store method to throw an error
    formModuleStore.updateFormModule = vi
      .fn()
      .mockRejectedValue(new Error('Update failed'));

    wrapper = mount(ManageFormModule, {
      global: {
        plugins: [pinia],
        stubs: {
          FormModuleSettings: true,
          ManageFormModuleVersions: true,
        },
      },
    });

    // Mock the form validation to succeed but the update to fail
    wrapper.vm.settingsFormModule = { validate: () => true };

    await wrapper.vm.updateSettings();
    await flushPromises();

    // Check if error notification was added
    expect(notificationStore.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          'trans.manageFormModule.updateFormModuleErr'
        ),
        consoleError: expect.stringContaining(
          'trans.manageFormModule.updateFormModuleErr'
        ),
      })
    );
  });

  it('expands and collapses panels correctly', async () => {
    wrapper = mount(ManageFormModule, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          FormModuleSettings: true,
          ManageFormModuleVersions: true,
          'v-expansion-panels': true,
          'v-expansion-panel': true,
          'v-expansion-panel-title': true,
          'v-expansion-panel-text': true,
        },
      },
    });

    // Check initial panel states
    expect(wrapper.vm.settingsPanel).toBe(0);
    expect(wrapper.vm.versionsPanel).toBe(0);
  });
});
