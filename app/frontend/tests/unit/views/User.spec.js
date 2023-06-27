import { createLocalVue, shallowMount } from '@vue/test-utils';
import User from '@/views/User.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();

describe('User.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(User, {
      localVue,
      stubs: ['router-view'],
      i18n
    });

    expect(wrapper.html()).toMatch('router-view');
  });
});
