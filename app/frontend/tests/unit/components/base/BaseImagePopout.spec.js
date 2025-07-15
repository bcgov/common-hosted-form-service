import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseImagePopout from '~/components/base/BaseImagePopout.vue';

describe('BaseImagePopout.vue', () => {
  it('renders', async () => {
    const wrapper = mount(BaseImagePopout, {
      props: {
        src: 'test',
      },
      global: {
        stubs: ['v-dialog', 'v-hover'],
      },
    });
    expect(wrapper.html()).toMatch('v-hover');
    expect(wrapper.html()).toMatch('v-dialog');
  });
});
