import { createLocalVue, shallowMount } from '@vue/test-utils';
import History from '@/views/user/History.vue';

const localVue = createLocalVue();

describe('History.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(History, {
      localVue,
      stubs: ['BaseSecure'],
    });

    expect(wrapper.text()).toMatch('Your Submission History');
  });
});
