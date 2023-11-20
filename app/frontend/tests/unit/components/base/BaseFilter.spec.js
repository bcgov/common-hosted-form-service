import { flushPromises, mount } from '@vue/test-utils';
import { describe, it } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import BaseFilter from '~/components/base/BaseFilter.vue';

describe('BaseFilter.vue', () => {
  it('renders', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    const search = wrapper.find('[data-test="filter-search"]');
    expect(search.exists()).toBeTruthy();
    const table = wrapper.find('[data-test="filter-table"]');
    expect(table.exists()).toBeTruthy();
    const saveBtn = wrapper.find('[data-test="save-btn"]');
    expect(saveBtn.exists()).toBeTruthy();
    const cancelBtn = wrapper.find('[data-test="cancel-btn"]');
    expect(cancelBtn.exists()).toBeTruthy();
    const checkboxes = wrapper.findAll('tbody input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);

    // Default column name and input data
    expect(wrapper.html()).toContain('columnName');
    expect(wrapper.html()).toContain('exampleText');
    expect(wrapper.html()).toContain('exampleText2');
  });

  it('renders with preset data', async () => {
    const wrapper = mount(BaseFilter, {
      props: {
        inputHeaders: [
          {
            title: 'TEST HEADER',
            align: 'start',
            sortable: true,
            key: 'title',
          },
        ],
        inputData: [
          {
            title: 'TEST NAME',
            key: 'fullName',
          },
        ],
        inputFilterPlaceholder: 'Filter Something',
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    const search = wrapper.find('[data-test="filter-search"]');
    expect(search.exists()).toBeTruthy();
    const table = wrapper.find('[data-test="filter-table"]');
    expect(table.exists()).toBeTruthy();
    const saveBtn = wrapper.find('[data-test="save-btn"]');
    expect(saveBtn.exists()).toBeTruthy();
    const cancelBtn = wrapper.find('[data-test="cancel-btn"]');
    expect(cancelBtn.exists()).toBeTruthy();

    // Does not contain default column name and input data
    expect(wrapper.html()).not.toContain('Column Name');
    expect(wrapper.html()).not.toContain('Example Text');
    expect(wrapper.html()).not.toContain('Example Text 2');

    expect(wrapper.html()).toContain('TEST HEADER');
    expect(wrapper.html()).toContain('TEST NAME');
    expect(wrapper.html()).toContain('Filter Something');
  });

  it('emits save', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    // emits nothing
    await wrapper.vm.savingFilterData();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted()).toHaveProperty('saving-filter-data');

    // emits selected data
    const selectedData = {
      title: 'Example Text',
      key: 'exampleText1',
    };
    wrapper.vm.selectedData = [selectedData];
    await wrapper.vm.savingFilterData();
    await wrapper.vm.$nextTick();
    // emitted object is wrapped in an array
    // selected data is also supposed to be in an array
    expect(wrapper.emitted('saving-filter-data')[1]).toEqual([[selectedData]]);
  });

  it('emits cancel', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    const btn = wrapper.find('[data-test="cancel-btn"]');
    expect(btn.exists()).toBeTruthy();

    await btn.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('cancel-filter-data');
  });
});
