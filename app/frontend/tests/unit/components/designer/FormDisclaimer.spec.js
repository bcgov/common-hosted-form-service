import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import i18n from '@/internationalization';
import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('FormDisclaimer.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(FormDisclaimer, {
      localVue,
      i18n
    });
    expect(wrapper.text()).toMatch('Disclaimer and statement of responsibility for Form Designers:');
  });
});
