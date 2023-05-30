import { createLocalVue, shallowMount } from '@vue/test-utils';
import Forms from '@/views/user/Forms.vue';

const localVue = createLocalVue();

describe('Forms.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Forms, {
      localVue,
      stubs: ['FormsTable'],
    });

    expect(wrapper.html()).toMatch('formstable');
  });
});
