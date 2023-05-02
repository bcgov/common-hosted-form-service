import { createLocalVue, shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Vuex from 'vuex';

import Root from '@/views/user/Root.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Root.vue', () => {
  it('renders without error', async () => {
    const wrapper = shallowMount(Root, {
      localVue,
      stubs: ['BaseSecure', 'router-link']
    });
    await nextTick();

    expect(wrapper.text()).toMatch('User');
  });
});
