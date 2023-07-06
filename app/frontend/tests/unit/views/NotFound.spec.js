import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NotFound from '~/views/NotFound.vue';

describe('NotFound.vue', () => {
  it('renders', () => {
    const wrapper = mount(NotFound, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('404: Page not found. :(');
  });
});
