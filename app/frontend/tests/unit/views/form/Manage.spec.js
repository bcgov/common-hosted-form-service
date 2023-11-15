import { createLocalVue, shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import Manage from '@/views/form/Manage.vue';

const localVue = createLocalVue();

describe('Manage.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Manage, {
      localVue,
      propsData: { f: 'f' },
      stubs: ['BaseSecure', 'ManageLayout'],
      i18n
    });

    expect(wrapper.html()).toMatch('basesecure');
  });
});
