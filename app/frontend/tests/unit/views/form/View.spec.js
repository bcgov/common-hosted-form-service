import { createLocalVue, shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import View from '@/views/form/View.vue';

const localVue = createLocalVue();

const $t = () => {}

describe('View.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(View, {
      localVue,
      stubs: ['BaseSecure', 'FormViewer'],
      i18n
    });

    expect(wrapper.html()).toMatch('formsubmission-stub');
  });
});
