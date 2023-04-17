import { createLocalVue, shallowMount } from '@vue/test-utils';

import Teams from '@/views/form/Teams.vue';

const localVue = createLocalVue();

describe('Teams.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Teams, {
      localVue,
      propsData: { f: 'f' },
      stubs: ['BaseSecure', 'TeamManagement'],
    });

    expect(wrapper.html()).toMatch('teammanagement');
  });
});
