import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Teams from '~/views/form/Teams.vue';

describe('Teams.vue', () => {
  it('renders', () => {
    const wrapper = mount(Teams, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          TeamManagement: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('team-management');
  });
});
