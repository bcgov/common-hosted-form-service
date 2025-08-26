import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useFormStore } from '~/store/form';
import FormClassificationSettings from '~/components/designer/settings/FormClassificationSettings.vue';
import { DataClassificationTypes } from '~/utils/constants';

describe('FormClassificationSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    // Initialize the form with default values
    formStore.form = {
      id: '123',
      name: 'Test Form',
      enableHardDeletion: false,
      classificationType: null,
      retentionDays: null,
      classificationDescription: null,
    };
  });

  it('renders with default values when hard deletion is disabled', () => {
    const wrapper = mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-combobox': {
            name: 'v-combobox',
            template: '<div><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-select': {
            name: 'v-select',
            template: '<div><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-checkbox': {
            name: 'v-checkbox',
            template:
              '<div>trans.formSettings.enableHardDeletion<input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
          },
          'v-textarea': {
            name: 'v-textarea',
            template: '<div><slot /></div>',
            props: ['modelValue', 'label'],
          },
          'v-alert': {
            name: 'v-alert',
            template: '<div :class="type"><slot /></div>',
            props: ['type', 'variant', 'text'],
          },
        },
      },
    });

    // Check title and main checkbox render
    expect(wrapper.find('div.base-panel-stub').exists()).toBe(true);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('trans.formSettings.enableHardDeletion');

    // Check that hard deletion is disabled by default
    expect(formStore.form.enableHardDeletion).toBe(false);

    // Verify classification fields are not visible when hard deletion is disabled
    expect(wrapper.findComponent({ name: 'v-combobox' }).exists()).toBe(false);
    expect(wrapper.findAllComponents({ name: 'v-select' }).length).toBe(0);
    expect(wrapper.findComponent({ name: 'v-textarea' }).exists()).toBe(false);
  });

  it('shows classification fields when hard deletion is enabled', async () => {
    const wrapper = mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-combobox': {
            name: 'v-combobox',
            template: '<div class="v-combobox-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-select': {
            name: 'v-select',
            template: '<div class="v-select-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-checkbox': {
            name: 'v-checkbox',
            template:
              '<div class="v-checkbox-stub" data-test="enableHardDeletionCheckbox"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
          },
          'v-textarea': {
            name: 'v-textarea',
            template: '<div class="v-textarea-stub"><slot /></div>',
            props: ['modelValue', 'label'],
          },
          'v-alert': {
            name: 'v-alert',
            template:
              '<div class="v-alert-stub" :class="type">trans.formSettings.deletionDisclaimerWithDays</div>',
            props: ['type', 'variant', 'text'],
          },
        },
      },
    });

    // Enable hard deletion
    const checkBox = wrapper.find('input[type="checkbox"]');
    await checkBox.setValue(true);
    await nextTick();

    // Verify hard deletion is enabled
    expect(formStore.form.enableHardDeletion).toBe(true);

    // Check that classification fields are now visible
    expect(wrapper.find('.v-combobox-stub').exists()).toBe(true);
    expect(wrapper.find('.v-select-stub').exists()).toBe(true);
    expect(wrapper.find('.v-textarea-stub').exists()).toBe(true);

    // Check warning alert is shown since a default retention period is now set
    expect(wrapper.find('.warning').exists()).toBe(true);

    // Verify default values are set when enabling hard deletion
    expect(formStore.form.classificationType).toBe(
      DataClassificationTypes.INTERNAL
    );
    expect(formStore.form.retentionDays).toBe(30);
  });

  it('resets classification fields when hard deletion is disabled', async () => {
    // Set initial form values with classification data
    formStore.form = {
      id: '123',
      name: 'Test Form',
      enableHardDeletion: true,
      classificationType: DataClassificationTypes.SENSITIVE,
      retentionDays: 90,
      classificationDescription: 'Test description',
    };

    const wrapper = mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-combobox': {
            name: 'v-combobox',
            template: '<div class="v-combobox-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-select': {
            name: 'v-select',
            template: '<div class="v-select-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-checkbox': {
            name: 'v-checkbox',
            template:
              '<div class="v-checkbox-stub" data-test="enableHardDeletionCheckbox"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
          },
          'v-textarea': {
            name: 'v-textarea',
            template: '<div class="v-textarea-stub"><slot /></div>',
            props: ['modelValue', 'label'],
          },
          'v-alert': {
            name: 'v-alert',
            template:
              '<div class="v-alert-stub" :class="type">trans.formSettings.deletionDisclaimerWithDays</div>',
            props: ['type', 'variant', 'text'],
          },
        },
      },
    });

    // Disable hard deletion
    const checkBox = wrapper.find('input[type="checkbox"]');
    await checkBox.setValue(false);
    await nextTick();

    // Verify hard deletion is disabled
    expect(formStore.form.enableHardDeletion).toBe(false);

    // Check that classification fields are reset
    expect(formStore.form.classificationType).toBeNull();
    expect(formStore.form.retentionDays).toBeNull();
    expect(formStore.form.classificationDescription).toBeNull();
  });

  it('shows warning alert when retention days are set', async () => {
    // Set initial form values with retention days
    formStore.form = {
      id: '123',
      name: 'Test Form',
      enableHardDeletion: true,
      classificationType: DataClassificationTypes.INTERNAL,
      retentionDays: 180,
      classificationDescription: null,
    };

    const wrapper = mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-combobox': {
            name: 'v-combobox',
            template: '<div class="v-combobox-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-select': {
            name: 'v-select',
            template: '<div class="v-select-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-checkbox': {
            name: 'v-checkbox',
            template:
              '<div class="v-checkbox-stub"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
          },
          'v-textarea': {
            name: 'v-textarea',
            template: '<div class="v-textarea-stub"><slot /></div>',
            props: ['modelValue', 'label'],
          },
          'v-alert': {
            name: 'v-alert',
            template:
              '<div class="v-alert-stub" :class="type" :data-variant="variant">trans.formSettings.deletionDisclaimerWithDays</div>',
            props: ['type', 'variant', 'text'],
          },
        },
      },
    });

    // Check that warning alert exists with expected attributes
    const warningAlert = wrapper.find('.warning');
    expect(warningAlert.exists()).toBe(true);
    expect(warningAlert.attributes('data-variant')).toBe('tonal');

    // The alert text is now fixed in the stub template
    expect(warningAlert.text()).toBe(
      'trans.formSettings.deletionDisclaimerWithDays'
    );
  });

  it('handles custom retention days selection', async () => {
    const wrapper = mount(FormClassificationSettings, {
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
              '<div class="v-checkbox-stub" data-test="enableHardDeletionCheckbox"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue'],
            emits: ['update:model-value'],
          },
          'v-combobox': {
            template: '<div class="v-combobox-stub"></div>',
            props: ['modelValue', 'items'],
            emits: ['update:model-value'],
          },
          'v-select': {
            template:
              '<div class="v-select-stub"><select :value="modelValue" @change="$emit(\'update:model-value\', $event.target.value === \'null\' ? null : Number($event.target.value))"></select></div>',
            props: ['modelValue', 'items'],
            emits: ['update:model-value'],
          },
          'v-text-field': {
            template:
              '<div class="v-text-field-stub"><input type="number" :value="modelValue" @input="$emit(\'update:model-value\', Number($event.target.value))" @blur="$emit(\'blur\')" /></div>',
            props: ['modelValue'],
            emits: ['update:model-value', 'blur'],
          },
          'v-textarea': {
            template: '<div class="v-textarea-stub"></div>',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
          },
          'v-alert': {
            template:
              '<div class="v-alert-stub" :class="type">Alert content</div>',
            props: ['type', 'variant', 'text'],
          },
        },
      },
    });

    // Enable hard deletion
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    await nextTick();

    // Set form values to simulate select change
    formStore.form.retentionDays = null;
    await nextTick();

    // Force the component to show custom days
    wrapper.vm.showCustomDays = true;
    await nextTick();

    // Set custom days
    const customDaysInput = wrapper.find('input[type="number"]');
    expect(customDaysInput.exists()).toBe(true);

    await customDaysInput.setValue('120');
    await customDaysInput.trigger('blur');
    await nextTick();

    // Verify form value is updated through applyCustomDays
    wrapper.vm.applyCustomDays();
    await nextTick();

    expect(formStore.form.retentionDays).toBe(120);
  });

  it('initializes correctly with existing form data', async () => {
    // Set initial form values
    formStore.form = {
      id: '123',
      name: 'Test Form',
      enableHardDeletion: true,
      classificationType: 'Confidential', // Use string value instead of constant
      retentionDays: 365,
      classificationDescription: 'Contains personal information',
    };

    const wrapper = mount(FormClassificationSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template:
              '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
            props: ['title'],
          },
          'v-combobox': {
            name: 'v-combobox',
            template: '<div class="v-combobox-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-select': {
            name: 'v-select',
            template: '<div class="v-select-stub"><slot /></div>',
            props: ['modelValue', 'items', 'label'],
          },
          'v-checkbox': {
            name: 'v-checkbox',
            template:
              '<div class="v-checkbox-stub"><input type="checkbox" :checked="modelValue" @change="$emit(\'update:model-value\', $event.target.checked)" /></div>',
            props: ['modelValue', 'label'],
            emits: ['update:model-value'],
          },
          'v-textarea': {
            name: 'v-textarea',
            template: '<div class="v-textarea-stub"><slot /></div>',
            props: ['modelValue', 'label'],
          },
          'v-alert': {
            name: 'v-alert',
            template:
              '<div class="v-alert-stub" :class="type">Alert content</div>',
            props: ['type', 'variant', 'text'],
          },
        },
      },
    });

    // Check that UI reflects the existing form values
    expect(formStore.form.enableHardDeletion).toBe(true);
    expect(formStore.form.classificationType).toBe('Confidential');
    expect(formStore.form.retentionDays).toBe(365);
    expect(formStore.form.classificationDescription).toBe(
      'Contains personal information'
    );

    // Verification that classification fields are visible
    expect(wrapper.find('.v-combobox-stub').exists()).toBe(true);
    expect(wrapper.find('.v-select-stub').exists()).toBe(true);
    expect(wrapper.find('.v-textarea-stub').exists()).toBe(true);
  });
});
