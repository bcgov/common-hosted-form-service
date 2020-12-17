import { createLocalVue, shallowMount } from '@vue/test-utils';
import AdminPage from '@/components/admin/AdminPage.vue';

const localVue = createLocalVue();

describe('AdminPage.vue', () => {
  it('renders ', async () => {
    const wrapper = shallowMount(AdminPage, {
      localVue,
      stubs: ['BaseSecure']
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Forms');
  });
});
