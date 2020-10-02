import { shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';

import About from '@/views/About.vue';

describe('About.vue', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();
  });

  it('renders', () => {
    const wrapper = shallowMount(About, {
      vuetify
    });

    expect(wrapper.html()).toMatch('Welcome to CHEFS');
  });
});
