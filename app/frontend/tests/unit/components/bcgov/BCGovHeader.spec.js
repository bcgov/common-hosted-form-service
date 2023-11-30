import { setActivePinia, createPinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import getRouter from '~/router';
import { useAuthStore } from '~/store/auth';

describe('BCGovHeader.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  it('renders', () => {
    // set keycloak ready to true, required for BaseAuthButton
    // to be visible
    authStore.ready = true;
    const wrapper = mount(BCGovHeader, {
      global: {
        plugins: [router, pinia],
        stubs: {
          BaseAuthButton: true,
          BaseInternationalization: true,
        },
      },
    });

    const btnHeaderTitle = wrapper.find('[data-test="btn-header-title"]');
    expect(btnHeaderTitle.exists()).toBeTruthy();
    expect(btnHeaderTitle.text()).toEqual(
      router?.currentRoute?.value?.meta?.title
        ? router.currentRoute.value.meta.title
        : ''
    );
    expect(wrapper.find('[data-test="base-auth-btn"]').exists()).toBeTruthy();
    expect(
      wrapper.find('[data-test="base-internationalization"]').exists()
    ).toBeTruthy();
  });
});
