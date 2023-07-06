import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import Success from '~/views/form/Success.vue';

describe('Success.vue', () => {
  it('renders', async () => {
    const wrapper = mount(Success, {
      props: {
        s: 's',
      },
      global: {
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
