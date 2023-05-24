import { createLocalVue, shallowMount } from '@vue/test-utils';
import Preview from '@/views/form/Preview.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();


describe('Preview.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Preview, {
      localVue,
      stubs: ['BaseSecure', 'FormViewer'],
      i18n
    });

    expect(wrapper.html()).toMatch('basesecure');
  });
});
