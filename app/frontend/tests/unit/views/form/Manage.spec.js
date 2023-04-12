import { createLocalVue, shallowMount } from '@vue/test-utils';

import Manage from '@/views/form/Manage.vue';

const localVue = createLocalVue();

describe('Manage.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Manage, {
      localVue,
      propsData: { f: 'f' },
      stubs: ['BaseSecure', 'ManageLayout'],
    });

    expect(wrapper.html()).toMatch('basesecure');
  });
});
