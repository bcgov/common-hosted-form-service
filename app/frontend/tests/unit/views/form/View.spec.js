import { createLocalVue, shallowMount } from '@vue/test-utils';

import View from '@/views/form/View.vue';

const localVue = createLocalVue();

describe('View.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(View, {
      localVue,
      stubs: ['BaseSecure', 'FormViewer'],
    });

    expect(wrapper.html()).toMatch('formsubmission-stub');
  });
});
