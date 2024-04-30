import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import Success from '~/views/form/Success.vue';

describe('Success.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  it('renders', async () => {
    const wrapper = mount(Success, {
      props: {
        s: 's',
      },
      global: {
        plugins: [pinia],
        stubs: {
          FormViewer: true,
          RequestReceipt: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.html()).toMatch('form-viewer');
  });
});
