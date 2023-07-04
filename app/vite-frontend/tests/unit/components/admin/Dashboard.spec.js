import { mount } from '@vue/test-utils';
import { expect } from 'vitest';

import Dashboard from '~/components/admin/Dashboard.vue';

describe('Dashboard.vue', () => {
  const URL = 'http://somewhere.com';

  it('renders', async () => {
    const wrapper = mount(Dashboard, {
      props: {
        url: URL,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.html()).toContain(URL);
  });
});
