// @vitest-environment happy-dom
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { VApp } from 'vuetify/components';

import getRouter from '~/router';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';

describe('BCGovFooter.vue', () => {
  const router = getRouter();
  it('renders', () => {
    const wrapper = mount(VApp, {
      global: {
        plugins: [createTestingPinia(), router],
      },
      slots: {
        default: h(BCGovFooter),
      },
    });
    const footerHome = wrapper.find('[id="footer-home"]');
    expect(footerHome.exists()).toBeTruthy();
    expect(footerHome.text()).toEqual('trans.bCGovFooter.home');
    const footerAbout = wrapper.find('[id="footer-about"]');
    expect(footerAbout.exists()).toBeTruthy();
    expect(footerAbout.text()).toEqual('trans.bCGovFooter.about');
    const footerDisclaimer = wrapper.find('[id="footer-disclaimer"]');
    expect(footerDisclaimer.exists()).toBeTruthy();
    expect(footerDisclaimer.text()).toEqual('trans.bCGovFooter.disclaimer');
    const footerPrivacy = wrapper.find('[id="footer-privacy"]');
    expect(footerPrivacy.exists()).toBeTruthy();
    expect(footerPrivacy.text()).toEqual('trans.bCGovFooter.privacy');
    const footerAccessibility = wrapper.find('[id="footer-accessibility"]');
    expect(footerAccessibility.exists()).toBeTruthy();
    expect(footerAccessibility.text()).toEqual(
      'trans.bCGovFooter.accessibility'
    );
    const footerCopyright = wrapper.find('[id="footer-copyright"]');
    expect(footerCopyright.exists()).toBeTruthy();
    expect(footerCopyright.text()).toEqual('trans.bCGovFooter.copyRight');
    const footerContact = wrapper.find('[id="footer-contact"]');
    expect(footerContact.exists()).toBeTruthy();
    expect(footerContact.text()).toEqual('trans.bCGovFooter.contactUs');
  });
});
