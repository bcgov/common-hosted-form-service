import { createLocalVue, shallowMount } from '@vue/test-utils';
import AdminPage from '@/components/admin/AdminPage.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();


describe('AdminPage.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(AdminPage, {
      localVue,
      stubs: ['AdminFormsTable', 'AdminUsersTable', 'Developer'],
      i18n
    });

    expect(wrapper.text()).toMatch('Forms');
  });
});
