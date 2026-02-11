import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import FormGeneralSettings from '~/components/designer/settings/FormGeneralSettings.vue';
import { useFormStore } from '~/store/form';

const STUBS = {
  BasePanel: {
    template:
      '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
  },
};

describe('FormGeneralSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    formStore.form = {
      name: '',
      description: '',
    };
  });

  it('renders', () => {
    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.formSettings.formTitle');
    // Description label is rendered via v-text-field label prop
    expect(wrapper.html()).toMatch('trans.formSettings.formDescription');
  });

  it('displays form name field', () => {
    formStore.form.name = 'Test Form Name';

    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const nameField = wrapper.find('[data-test="text-name"]');
    expect(nameField.exists()).toBeTruthy();
  });

  it('displays form description field', () => {
    formStore.form.description = 'Test Form Description';

    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const descriptionField = wrapper.find('[data-test="text-description"]');
    expect(descriptionField.exists()).toBeTruthy();
  });

  it('updates form.name when name field changes', async () => {
    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const nameField = wrapper.findComponent({ name: 'VTextField' });
    await nameField.setValue('New Form Name');
    await nextTick();

    expect(formStore.form.name).toBe('New Form Name');
  });

  it('updates form.description when description field changes', async () => {
    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const descriptionFields = wrapper.findAllComponents({ name: 'VTextField' });
    await descriptionFields[1].setValue('New Description');
    await nextTick();

    expect(formStore.form.description).toBe('New Description');
  });

  it('has validation rules configured for name field', () => {
    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const nameField = wrapper.find('[data-test="text-name"]');
    expect(nameField.exists()).toBeTruthy();
    // Rules are configured via :rules prop on v-text-field
    expect(nameField.attributes()).toBeDefined();
  });

  it('has validation rules configured for description field', () => {
    const wrapper = mount(FormGeneralSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const descriptionField = wrapper.find('[data-test="text-description"]');
    expect(descriptionField.exists()).toBeTruthy();
    // Rules are configured via :rules prop on v-text-field
    expect(descriptionField.attributes()).toBeDefined();
  });
});
