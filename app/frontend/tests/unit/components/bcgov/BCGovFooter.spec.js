import { shallowMount } from '@vue/test-utils';
import BCGovFooter from '@/components/bcgov/BCGovFooter.vue';
import i18n from '@/internationalization';

describe('BCGovFooter.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(BCGovFooter, {i18n});
    expect(wrapper.text()).toMatch('About gov.bc.ca');
  });
});
