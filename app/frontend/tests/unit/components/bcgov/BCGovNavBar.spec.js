import { shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';

import BCGovNavBar from '@/components/bcgov/BCGovNavBar.vue';

describe('BCGovNavBar.vue', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();
  });

  it('renders', () => {
    const wrapper = shallowMount(BCGovNavBar, {
      mocks: {
        $route: {
          meta: {}
        }
      },
      stubs: ['router-link'],
      vuetify
    });

    expect(wrapper.text()).toContain('About');
    expect(wrapper.text()).toContain('My Forms');
    expect(wrapper.text()).toContain('Create a New Form');
    expect(wrapper.text()).toContain('User');
  });
});
