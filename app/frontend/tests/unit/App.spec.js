import { flushPromises, shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoute } from 'vue-router';
import { ref } from 'vue';

import App from '~/App.vue';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';

// tenant store uses these; mock to avoid side-effects
vi.mock('~/store/notification', () => ({
  useNotificationStore: () => ({ addNotification: vi.fn() }),
}));

vi.mock('~/router', () => ({
  default: vi.fn(() => ({ currentRoute: { value: { meta: {} } } })),
}));

vi.mock('vue-router');

describe('App.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    // Prevent identityProvider getter from throwing when keycloak is accessed
    // during initializeStore → isBCServicesCardUser on mount
    const authStore = useAuthStore();
    authStore.keycloak = { tokenParsed: null };
  });

  const mountApp = (routeMock, stubs = {}) => {
    useRoute.mockReturnValue(routeMock);
    return shallowMount(App, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="v-router-view-stub"><slot /></div>',
          },
          ...stubs,
        },
      },
    });
  };

  it('renders', async () => {
    const wrapper = mountApp(
      { query: { name: 'NotFormSubmitOrFormView' } },
      {
        VLayout: {
          name: 'VLayout',
          template: '<div class="v-layout-stub"><slot /></div>',
        },
        VMain: {
          name: 'VMain',
          template: '<div class="v-main-stub"><slot /></div>',
        },
      }
    );

    await flushPromises();

    expect(
      wrapper.find('base-notification-container-stub').exists()
    ).toBeTruthy();
    expect(wrapper.find('b-c-gov-header-stub').exists()).toBeTruthy();
    expect(wrapper.find('b-c-gov-nav-bar-stub').exists()).toBeTruthy();
    expect(wrapper.find('b-c-gov-footer-stub').exists()).toBeTruthy();
  });

  it('isWidePage should be main for non FormSubmit, FormView, FormSuccess views', () => {
    const wrapper = mountApp({ query: { name: 'NotFormSubmitOrFormView' } });
    expect(wrapper.vm.isWidePage).toBe('main');
    expect(wrapper.vm.isValidRoute).toBeFalsy();
  });

  it('isWidePage should be main for non FormSubmit, FormView, FormSuccess views even if isWideLayout is true', async () => {
    const wrapper = mountApp({ query: { name: 'NotFormSubmitOrFormView' } });
    wrapper.vm.isWideLayout = ref(true);
    await flushPromises();
    expect(wrapper.vm.isWidePage).toBe('main');
    expect(wrapper.vm.isValidRoute).toBeFalsy();
  });

  it('isWidePage should be main-wide for FormSubmit', () => {
    const wrapper = mountApp({ name: 'FormSubmit' });
    wrapper.vm.isWideLayout = true;
    expect(wrapper.vm.isWidePage).toBe('main-wide');
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('isWidePage should be main-wide for FormView', () => {
    const wrapper = mountApp({ name: 'FormView' });
    wrapper.vm.isWideLayout = true;
    expect(wrapper.vm.isWidePage).toBe('main-wide');
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('isWidePage should be main-wide for FormSuccess', () => {
    const wrapper = mountApp({ name: 'FormSuccess' });
    wrapper.vm.isWideLayout = true;
    expect(wrapper.vm.isWidePage).toBe('main-wide');
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('setWideLayout should toggle isWideLayout', () => {
    const wrapper = mountApp({ name: 'FormView' });
    expect(wrapper.vm.isWideLayout).toBeFalsy();
    wrapper.vm.setWideLayout(true);
    expect(wrapper.vm.isWideLayout).toBeTruthy();
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('isFormSubmitMode should return formSubmitMode from the router if it exists', () => {
    const wrapper = mountApp({ meta: { formSubmitMode: true } });
    expect(wrapper.vm.isFormSubmitMode).toBeTruthy();
  });

  it('appTitle appends | Personal when tenant feature is enabled and no tenant is selected', () => {
    const TITLE = 'THIS IS AN APP TITLE';
    const wrapper = mountApp({ meta: { title: TITLE } });
    // isTenantFeatureEnabled defaults to true; no tenant selected → Personal
    expect(wrapper.vm.appTitle).toEqual(`${TITLE} | Personal`);
  });

  it('appTitle appends | Enterprise when a tenant is selected', () => {
    const TITLE = 'THIS IS AN APP TITLE';
    const tenant = { id: 't1', name: 'Tenant 1' };
    // Set both localStorage (read by initializeStore on mount) and the in-memory
    // store value (read by the appTitle computed before/after mount).
    localStorage.setItem('selectedTenant', JSON.stringify(tenant));
    const tenantStore = useTenantStore();
    tenantStore.selectedTenant = tenant;
    const wrapper = mountApp({ meta: { title: TITLE } });
    expect(wrapper.vm.appTitle).toEqual(`${TITLE} | Enterprise`);
  });

  it('appTitle has no suffix when tenant feature is disabled', () => {
    const TITLE = 'THIS IS AN APP TITLE';
    useAppStore().config = { tenantFeatureEnabled: false };
    const wrapper = mountApp({ meta: { title: TITLE } });
    expect(wrapper.vm.appTitle).toEqual(TITLE);
  });

  it('calls tenantStore.initializeStore on mount', async () => {
    // Ensure keycloak is defined so identityProvider getter does not throw
    const authStore = useAuthStore();
    authStore.keycloak = { tokenParsed: null };

    const tenantStore = useTenantStore();
    const initSpy = vi.spyOn(tenantStore, 'initializeStore');

    mountApp({ query: {} });
    await flushPromises();

    expect(initSpy).toHaveBeenCalledOnce();
  });
});
