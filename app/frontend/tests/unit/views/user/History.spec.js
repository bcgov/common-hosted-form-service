import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import History from '~/views/user/History.vue';

describe('History.vue', () => {
  it('renders', () => {
    const wrapper = mount(History, {
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.html()).toMatch('Your Submission History (TBD)');
  });
});
