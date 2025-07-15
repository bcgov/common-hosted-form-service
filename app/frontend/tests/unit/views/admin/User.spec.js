import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import User from '~/views/admin/User.vue';

describe('User.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(User, {
      props: {
        u: 'u',
      },
      global: {
        stubs: {
          AdministerUser: true,
        },
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.admin.user.administerUser');
    expect(wrapper.html()).toMatch('administer-user');
  });
});
