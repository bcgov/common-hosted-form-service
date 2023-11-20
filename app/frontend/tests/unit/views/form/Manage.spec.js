import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Manage from '~/views/form/Manage.vue';

describe('Manage.vue', () => {
  it('renders', () => {
    const wrapper = mount(Manage, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          ManageLayout: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('manage-layout');
  });
});
