import { createLocalVue, shallowMount } from '@vue/test-utils';

import Submit from '@/views/form/Submit.vue';

const localVue = createLocalVue();

describe('Submit.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Submit, {
      localVue,
      stubs: ['FormViewer'],
    });

    expect(wrapper.html()).toMatch('formviewer');
  });
});
