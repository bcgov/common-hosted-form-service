import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useAuthStore } from '~/store/auth';
import Error from '~/views/Error.vue';

describe('Error.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);

  beforeEach(() => {
    authStore.$reset();
  });

  it('renders', async () => {
    const wrapper = mount(Error, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toMatch('trans.error.somethingWentWrong');
  });

  it('renders with a custom error message', async () => {
    const wrapper = mount(Error, {
      props: {
        text: 'Custom Error Message',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    expect(wrapper.text()).toMatch('Custom Error Message');
  });
});
