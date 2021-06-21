import { createLocalVue, shallowMount } from '@vue/test-utils';

import Form from '@/views/Form.vue';

const localVue = createLocalVue();

describe('Form.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Form, {
      localVue,
      stubs: ['router-view'],
    });

    expect(wrapper.html()).toMatch('router-view');
  });
});
