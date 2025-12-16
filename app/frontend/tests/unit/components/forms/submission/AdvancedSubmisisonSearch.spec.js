import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import AdvancedSubmisisonSearch from '../../../../../src/components/forms/submission/AdvancedSubmissionSearch.vue';
import { STUBS } from '../../../stubs';

describe('AdvancedSubmissionSearch.vue', () => {
  const formFields = [
    { label: 'First Name', value: 'firstName' },
    { label: 'Last Name', value: 'lastName' },
  ];

  function factory(props = {}) {
    return mount(AdvancedSubmisisonSearch, {
      props: {
        modelValue: false,
        formFields,
        ...props,
      },
      global: {
        provide: {
          // Fake layout injection to satisfy Vuetify
          layout: {
            register: () => {},
            unregister: () => {},
            mainRect: { value: { height: 1000 } },
          },
        },
        stubs: {
          ...STUBS,

          VNavigationDrawer: {
            name: 'VNavigationDrawer',
            template: '<div class="v-navigation-drawer-stub"><slot /></div>',
            props: ['modelValue', 'location', 'temporary', 'width'],
          },

          VSelect: {
            name: 'VSelect',
            props: ['modelValue', 'items'],
            template: `<div class="v-select-stub"><slot /></div>`,
          },

          VChip: {
            name: 'VChip',
            props: ['closable'],
            template: `
              <div class="v-chip-stub" @click="$emit('click:close')">
                <slot />
              </div>
            `,
          },
        },
      },
    });
  }

  it('opens when modelValue=true and emits update:modelValue when toggled', async () => {
    const wrapper = factory({ modelValue: true });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isOpen).toBe(true);

    wrapper.vm.isOpen = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false]);
  });

  it('emits search payload and closes drawer on emitSearchAndApply()', async () => {
    const wrapper = factory({ modelValue: true });

    wrapper.vm.searchQuery = 'abc';
    wrapper.vm.selectedFields = ['firstName', 'lastName'];

    wrapper.vm.emitSearchAndApply();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().search[0][0]).toEqual({
      value: 'abc',
      fields: ['firstName', 'lastName'],
    });

    // drawer should close
    expect(wrapper.vm.isOpen).toBe(false);
  });

  it('getLabel returns matching label for field value', () => {
    const wrapper = factory();

    expect(wrapper.vm.getLabel('firstName')).toBe('First Name');
    expect(wrapper.vm.getLabel('lastName')).toBe('Last Name');
    expect(wrapper.vm.getLabel('unknown')).toBe('unknown'); // fallback
  });

  it('removeField removes a field from selectedFields', async () => {
    const wrapper = factory();

    wrapper.vm.selectedFields = ['firstName', 'lastName'];
    wrapper.vm.removeField('firstName');

    expect(wrapper.vm.selectedFields).toEqual(['lastName']);
  });

  it('clicking a chip close icon triggers removeField()', async () => {
    const wrapper = factory({ modelValue: true });

    wrapper.vm.selectedFields = ['firstName', 'lastName'];
    await wrapper.vm.$nextTick();

    // Chips rendered as stubbed <v-chip> elements
    const chips = wrapper.findAllComponents({ name: 'VChip' });
    expect(chips.length).toBe(2);

    // Simulate clicking close on first chip
    await chips[0].vm.$emit('click:close');

    expect(wrapper.vm.selectedFields).toEqual(['lastName']);
  });

  it('closeDrawer sets isOpen=false and emits update:modelValue', async () => {
    const wrapper = factory({ modelValue: true });

    wrapper.vm.closeDrawer();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isOpen).toBe(false);
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false]);
  });
});
