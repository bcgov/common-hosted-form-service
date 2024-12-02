import { flushPromises, mount } from '@vue/test-utils';
import { describe, it } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import BaseFilter from '~/components/base/BaseFilter.vue';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';

describe('BaseFilter.vue', () => {
  const pinia = createTestingPinia();
  const formStore = useFormStore();
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders', async () => {
    formStore.isRTL = true;
    const wrapper = mount(BaseFilter, {
      global: {
        plugins: [pinia],
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

    expect(wrapper.vm.RTL).toBe('ml-3');
  });

  it('renders with preset data', async () => {
    formStore.isRTL = false;
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
        inputSaveButtonText: 'Save Text',
      },
      global: {
        plugins: [pinia],
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
    expect(wrapper.html()).toContain('Save Text');

    expect(wrapper.vm.RTL).toBe('mr-3');
  });

  it('emits save', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
        plugins: [pinia],
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
        plugins: [pinia],
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

  it('reset columns button should reset values', async () => {
    const RESET_DATA = ['This is an example'];
    const wrapper = mount(BaseFilter, {
      props: {
        resetData: RESET_DATA,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedData = ['SOME DATA'];
    wrapper.vm.inputFilter = 'something';

    await flushPromises();

    const btn = wrapper.find('[data-test="reset-columns-btn"]');
    expect(btn.exists()).toBeTruthy();

    await btn.trigger('click');

    expect(wrapper.vm.selectedData).toEqual(RESET_DATA);
    expect(wrapper.vm.inputFilter).toEqual('');
  });
});
