import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import Root from '@/views/user/Root.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Root.vue', () => {
  it('renders without error', async () => {
    const wrapper = shallowMount(Root, {
      localVue,
      stubs: ['BaseSecure', 'router-link'],
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('User');
  });
});
