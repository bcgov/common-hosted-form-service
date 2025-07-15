import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import User from '~/views/User.vue';

describe('User.vue', () => {
  it('renders', () => {
    const wrapper = mount(User, {
      global: {
        stubs: {
          RouterView: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('router-view');
  });
});
