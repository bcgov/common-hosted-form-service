import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useAuthStore } from '~/store/auth';
import Admin from '~/views/Admin.vue';

describe('Admin.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);

  beforeEach(() => {
    authStore.$reset();
  });

  it('renders', async () => {
    authStore.isAdmin = true;
    const wrapper = mount(Admin, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterView: true,
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
        },
      },
    });

    await nextTick();

    expect(wrapper.html()).toMatch('v-container');
    expect(wrapper.html()).toMatch('router-view');
  });
});
