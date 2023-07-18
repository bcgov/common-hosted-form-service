import { flushPromises, mount } from '@vue/test-utils';
import { describe, it } from 'vitest';

import BaseFilter from '~/components/base/BaseFilter.vue';

describe('BaseFilter.vue', () => {
  it('renders', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.baseFilter.cancel');
  });

  it('emits save', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
        stubs: {
          VDialog: {
            name: 'VCard',
            template: '<div class="v-card-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    const btn = wrapper.find('[data-test="save-btn"]');
    expect(btn.exists()).toBeTruthy();

    await btn.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('saving-filter-data');
  });

  it('emits cancel', async () => {
    const wrapper = mount(BaseFilter, {
      global: {
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
