import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Root from '~/views/admin/Root.vue';

describe('Root.vue', () => {
  it('renders', () => {
    const wrapper = mount(Root, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          AdminPage: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.admin.root.admin');
    expect(wrapper.html()).toMatch('admin-page');
  });
});
