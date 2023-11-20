import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import Root from '~/views/admin/Root.vue';

describe('Root.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(Root, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          AdminPage: true,
        },
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.admin.root.admin');
    expect(wrapper.html()).toMatch('admin-page');
  });
});
