import { shallowMount } from '@vue/test-utils';
import Dashboard from '@/components/admin/Dashboard.vue';

describe('Dashboard.vue', () => {
  it('renders', () => {
    const URL = 'http://somewhere.com';

    const wrapper = shallowMount(Dashboard, {
      propsData: {
        url: URL,
      },
    });

    expect(wrapper.html()).toContain(URL);
  });
});
