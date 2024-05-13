import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import { useAuthStore } from '~/store/auth';

describe('BCGovHeader.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore();

  it('if formSubmitMode is false then show the app title', () => {
    const APP_TITLE = 'This is an app title';
    // set keycloak ready to true, required for BaseAuthButton
    // to be visible
    authStore.ready = true;
    const wrapper = mount(BCGovHeader, {
      props: {
        formSubmitMode: false,
        appTitle: APP_TITLE,
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseAuthButton: true,
          BaseInternationalization: true,
        },
      },
    });

    const btnHeaderTitle = wrapper.find('[data-test="btn-header-title"]');
    expect(btnHeaderTitle.exists()).toBeTruthy();
    expect(btnHeaderTitle.text()).toContain(APP_TITLE);
    expect(wrapper.find('[data-test="base-auth-btn"]').exists()).toBeTruthy();
    expect(
      wrapper.find('[data-test="base-internationalization"]').exists()
    ).toBeTruthy();
  });

  it('if formSubmitMode is true then do not show the app title', () => {
    const APP_TITLE = 'This is an app title';
    // set keycloak ready to true, required for BaseAuthButton
    // to be visible
    authStore.ready = true;
    const wrapper = mount(BCGovHeader, {
      props: {
        formSubmitMode: true,
        appTitle: APP_TITLE,
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseAuthButton: true,
          BaseInternationalization: true,
        },
      },
    });

    const btnHeaderTitle = wrapper.find('[data-test="btn-header-title"]');
    expect(btnHeaderTitle.exists()).toBeFalsy();
    expect(wrapper.html()).not.toContain(APP_TITLE);
    expect(wrapper.find('[data-test="base-auth-btn"]').exists()).toBeTruthy();
    expect(
      wrapper.find('[data-test="base-internationalization"]').exists()
    ).toBeTruthy();
  });
});
