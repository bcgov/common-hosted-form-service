import { createLocalVue, shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import Submit from '@/views/form/Submit.vue';

const localVue = createLocalVue();

describe('Submit.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Submit, {
      localVue,
      stubs: ['FormViewer'],
      i18n
    });

    expect(wrapper.html()).toMatch('formviewer');
  });
});
