import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import User from '~/views/admin/User.vue';

describe('User.vue', () => {
  it('renders', () => {
    const wrapper = mount(User, {
      props: {
        u: 'u',
      },
      global: {
        stubs: {
          AdministerUser: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('Administer User');
    expect(wrapper.html()).toMatch('administer-user');
  });
});
