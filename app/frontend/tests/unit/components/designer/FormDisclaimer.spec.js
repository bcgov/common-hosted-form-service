import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';

import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('FormDisclaimer.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(FormDisclaimer, {
      localVue,
    });
    expect(wrapper.text()).toMatch('Disclaimer and statement of responsibility for Form Designers:');
  });
});
