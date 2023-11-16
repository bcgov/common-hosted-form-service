import { createLocalVue, shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import Form from '@/views/Form.vue';

const localVue = createLocalVue();


describe('Form.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Form, {
      localVue,
      stubs: ['router-view'],
      i18n
    });

    expect(wrapper.html()).toMatch('router-view');
  });
});
