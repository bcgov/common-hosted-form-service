import { createLocalVue, shallowMount } from '@vue/test-utils';

import Success from '@/views/form/Success.vue';

const localVue = createLocalVue();

describe('Success.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Success, {
      localVue,
      stubs: ['FormViewer'],
    });

    expect(wrapper.html()).toMatch('formviewer');
  });
});
