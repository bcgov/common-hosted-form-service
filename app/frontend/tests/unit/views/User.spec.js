import { createLocalVue, shallowMount } from '@vue/test-utils';
import User from '@/views/User.vue';

const localVue = createLocalVue();

describe('User.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(User, {
      localVue,
      stubs: ['router-view'],
    });

    expect(wrapper.html()).toMatch('router-view');
  });
});
