import { createLocalVue, shallowMount } from '@vue/test-utils';

import Preview from '@/views/form/Preview.vue';

const localVue = createLocalVue();

describe('Preview.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Preview, {
      localVue,
      stubs: ['BaseSecure', 'FormViewer'],
    });

    expect(wrapper.html()).toMatch('basesecure');
  });
});
