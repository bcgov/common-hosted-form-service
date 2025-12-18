import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import FormMinistryProfile from '~/components/designer/profile/FormMinistryProfile.vue';
import { useFormStore } from '~/store/form';
import { Ministries } from '~/utils/constants';

describe('FormMinistryProfile.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    formStore.form = {
      ministry: null,
    };
  });

  it('renders', () => {
    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('trans.formProfile.ministryPrompt');
    expect(wrapper.text()).toContain('trans.formProfile.ministryName');
  });

  it('shows required indicator when ministry is not set', () => {
    formStore.form.ministry = null;

    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain('*');
  });

  it('does not show required indicator when ministry is set', () => {
    formStore.form.ministry = 'test-ministry';

    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).not.toContain('*');
  });

  it('updates form.ministry when autocomplete value changes', async () => {
    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' });
    expect(autocomplete.exists()).toBeTruthy();

    autocomplete.vm.$emit('update:modelValue', 'test-ministry-id');
    await nextTick();

    expect(formStore.form.ministry).toBe('test-ministry-id');
  });

  it('populates ministry list from constants', () => {
    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' });
    const items = autocomplete.props('items');

    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.id && item.text)).toBe(true);
  });

  it('sorts ministry list alphabetically', () => {
    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' });
    const items = autocomplete.props('items');

    const sortedItems = [...items].sort((a, b) => a.text.localeCompare(b.text));

    expect(items).toEqual(sortedItems);
  });

  it('applies RTL class when isRTL is true', () => {
    formStore.isRTL = true;

    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' });
    expect(autocomplete.classes()).toContain('label');
  });

  it('validates ministry selection', async () => {
    const wrapper = mount(FormMinistryProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const autocomplete = wrapper.findComponent({ name: 'VAutocomplete' });
    const rules = autocomplete.props('rules');

    expect(rules).toBeDefined();
    expect(rules.length).toBeGreaterThan(0);

    // Test validation rule
    const validationResult = rules[0](null);
    expect(validationResult).toBeTruthy(); // Should return error message

    const validationResultWithValue = rules[0]('test-ministry');
    expect(validationResultWithValue).toBe(true); // Should pass validation
  });
});
