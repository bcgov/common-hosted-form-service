import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useFormStore } from '~/store/form';
import { useRecordsManagementStore } from '~/store/recordsManagement';
import FormClassificationSettings from '~/components/designer/settings/FormClassificationSettings.vue';
import vuetifyStub from '../../../../vuetify-stubs';

// Mock the services
vi.mock('~/services', async () => ({
  recordsManagementService: {
    listRetentionClassificationTypes: vi.fn().mockResolvedValue({
      data: [
        { id: 'class-1', display: 'Public' },
        { id: 'class-2', display: 'Internal' },
        { id: 'class-3', display: 'Confidential' },
      ],
    }),
  },
}));

describe('FormClassificationSettings.vue', async () => {
  let pinia;
  let formStore;
  let recordsManagementStore;

  beforeEach(() => {
    pinia = createTestingPinia();
    formStore = useFormStore(pinia);
    recordsManagementStore = useRecordsManagementStore(pinia);

    // Initialize stores with proper defaults BEFORE anything else
    formStore.form = {
      id: '123',
      name: 'Test Form',
    };
    formStore.isRTL = false;

    // Initialize classification types FIRST
    recordsManagementStore.retentionClassificationTypes = [
      { id: 'class-1', display: 'Public' },
      { id: 'class-2', display: 'Internal' },
      { id: 'class-3', display: 'Confidential' },
    ];

    // Then initialize retention policy
    recordsManagementStore.formRetentionPolicy = {
      formId: '123',
      retentionDays: null,
      retentionClassificationId: null,
      retentionClassificationDescription: null,
    };
  });

  it('renders with default values when hard deletion is disabled', async () => {
    const wrapper = await mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
        },
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
      },
    });

    expect(wrapper.find('div.base-panel-stub').exists()).toBe(true);
  });

  it('shows classification fields when hard deletion is enabled', async () => {
    const wrapper = await mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-checkbox': {
            template:
              '<div class="v-checkbox-stub"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue'],
            emits: ['update:model-value'],
          },
          'v-combobox': vuetifyStub,
          'v-select': vuetifyStub,
          'v-text-field': vuetifyStub,
          'v-textarea': vuetifyStub,
          'v-alert': vuetifyStub,
          'v-tooltip': vuetifyStub,
          'v-icon': vuetifyStub,
        },
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
      },
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    await nextTick();

    expect(
      recordsManagementStore.formRetentionPolicy.retentionClassificationId
    ).toBe('class-1');
    expect(recordsManagementStore.formRetentionPolicy.retentionDays).toBe(30);
  });

  it('resets classification fields when hard deletion is disabled', async () => {
    recordsManagementStore.formRetentionPolicy = {
      formId: '123',
      retentionDays: 90,
      retentionClassificationId: 'class-3',
      retentionClassificationDescription: 'Test description',
    };

    const wrapper = await mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-checkbox': {
            template:
              '<div class="v-checkbox-stub"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue'],
            emits: ['update:model-value'],
          },
          'v-combobox': vuetifyStub,
          'v-select': vuetifyStub,
          'v-textarea': vuetifyStub,
          'v-alert': vuetifyStub,
          'v-tooltip': vuetifyStub,
          'v-icon': vuetifyStub,
        },
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
      },
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    // First enable it
    await checkbox.setValue(true);
    await nextTick();
    // Then disable it
    await checkbox.setValue(false);
    await nextTick();

    expect(recordsManagementStore.formRetentionPolicy.retentionDays).toBeNull();
    expect(
      recordsManagementStore.formRetentionPolicy.retentionClassificationId
    ).toBeNull();
  });

  it('shows warning alert when retention days are set', async () => {
    recordsManagementStore.formRetentionPolicy = {
      formId: '123',
      retentionDays: 180,
      retentionClassificationId: 'class-1',
      retentionClassificationDescription: null,
      enabled: true,
    };

    const wrapper = await mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-checkbox': vuetifyStub,
          'v-combobox': vuetifyStub,
          'v-select': vuetifyStub,
          'v-textarea': vuetifyStub,
          'v-alert': {
            template:
              '<div class="v-alert-stub" :data-type="type"><slot /></div>',
            props: ['type', 'variant'],
          },
          'v-tooltip': vuetifyStub,
          'v-icon': vuetifyStub,
        },
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
      },
    });

    // Set retention policy enabled to true since retention data exists
    await wrapper.vm.$nextTick();

    const alert = wrapper.find('.v-alert-stub[data-type="warning"]');
    expect(alert.exists()).toBe(true);
  });

  it('handles custom retention days selection', async () => {
    const wrapper = await mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-checkbox': {
            template:
              '<div class="v-checkbox-stub"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue'],
            emits: ['update:model-value'],
          },
          'v-combobox': vuetifyStub,
          'v-select': vuetifyStub,
          'v-text-field': vuetifyStub,
          'v-textarea': vuetifyStub,
          'v-alert': vuetifyStub,
          'v-tooltip': vuetifyStub,
          'v-icon': vuetifyStub,
        },
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
      },
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    await nextTick();

    expect(
      recordsManagementStore.formRetentionPolicy.retentionDays
    ).toBeGreaterThan(0);
  });

  it('initializes correctly with existing form data', async () => {
    recordsManagementStore.formRetentionPolicy = {
      formId: '123',
      retentionDays: 365,
      retentionClassificationId: 'class-3',
      retentionClassificationDescription: 'Contains personal information',
    };

    mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-checkbox': vuetifyStub,
          'v-combobox': vuetifyStub,
          'v-select': vuetifyStub,
          'v-textarea': vuetifyStub,
          'v-alert': vuetifyStub,
          'v-tooltip': vuetifyStub,
          'v-icon': vuetifyStub,
        },
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
      },
    });

    expect(recordsManagementStore.formRetentionPolicy.retentionDays).toBe(365);
    expect(
      recordsManagementStore.formRetentionPolicy.retentionClassificationId
    ).toBe('class-3');
  });
});
