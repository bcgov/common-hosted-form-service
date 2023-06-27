import { createLocalVue, shallowMount } from '@vue/test-utils';
import AdminPage from '@/components/admin/AdminPage.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();

describe('AdminPage.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(AdminPage, {
      localVue,
      mocks: {
        $config: {},
      },
      stubs: [
        'AdminFormsTable',
        'AdminUsersTable',
        'Developer',
        'FormComponentsProactiveHelp',
        'Metrics',
      ],
      i18n,
    });

    expect(wrapper.text()).toContain('Forms');
    expect(wrapper.text()).not.toContain('Metrics');
  });

  it('renders without metrics', () => {
    const wrapper = shallowMount(AdminPage, {
      localVue,
      mocks: {
        $config: { adminDashboardUrl: '' },
      },
      stubs: [
        'AdminFormsTable',
        'AdminUsersTable',
        'Developer',
        'FormComponentsProactiveHelp',
        'Metrics',
      ],
      i18n,
    });

    expect(wrapper.text()).not.toContain('Metrics');
  });

  it('renders with metrics', () => {
    const wrapper = shallowMount(AdminPage, {
      localVue,
      mocks: {
        $config: { adminDashboardUrl: 'x' },
      },
      stubs: [
        'AdminFormsTable',
        'AdminUsersTable',
        'Developer',
        'FormComponentsProactiveHelp',
        'Metrics',
      ],
      i18n,
    });

    expect(wrapper.text()).toContain('Metrics');
  });
});
