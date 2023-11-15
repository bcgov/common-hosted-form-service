import { createLocalVue, shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import Success from '@/views/form/Success.vue';

const localVue = createLocalVue();


describe('Success.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Success, {
      localVue,
      stubs: ['FormViewer'],
      i18n
    });

    expect(wrapper.html()).toMatch('formviewer');
  });
});
