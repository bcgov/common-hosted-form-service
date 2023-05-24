import { shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import i18n from '@/internationalization';
import BCGovHeader from '@/components/bcgov/BCGovHeader.vue';


describe('BCGovHeader.vue', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();
  });

  it('renders', () => {
    const wrapper = shallowMount(BCGovHeader, {
      vuetify,
      stubs: ['BaseAuthButton'],
      i18n
    });

    expect(wrapper.text()).toMatch('');
  });
});
