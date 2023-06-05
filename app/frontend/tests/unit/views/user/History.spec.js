import { createLocalVue, shallowMount } from '@vue/test-utils';
import History from '@/views/user/History.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();

describe('History.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(History, {
      localVue,
      stubs: ['BaseSecure'],
      i18n
    });

    expect(wrapper.text()).toMatch('Your Submission History');
  });
});
