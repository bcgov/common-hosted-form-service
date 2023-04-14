import { createLocalVue, shallowMount } from '@vue/test-utils';
import AdminPage from '@/components/admin/AdminPage.vue';

const localVue = createLocalVue();

describe('AdminPage.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(AdminPage, {
      localVue,
      stubs: ['AdminFormsTable', 'AdminUsersTable', 'Developer'],
    });

    expect(wrapper.text()).toMatch('Forms');
  });
});
