import { shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';

import App from '@/App.vue';

describe('App.vue', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();
  });

  it('renders', () => {
    const wrapper = shallowMount(App, {
      vuetify,
      stubs: ['BaseNotificationContainer', 'BaseSecure', 'BCGovFooter', 'BCGovHeader', 'BCGovNavBar', 'router-view'],
    });

    expect(wrapper.text()).toMatch('');
  });
});
