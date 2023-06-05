import { createLocalVue, shallowMount } from '@vue/test-utils';
import Forms from '@/views/user/Forms.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();

describe('Forms.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Forms, {
      localVue,
      stubs: ['FormsTable'],
      i18n
    });

    expect(wrapper.html()).toMatch('formstable');
  });
});
