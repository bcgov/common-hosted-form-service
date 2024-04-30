import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { i18n } from '~/internationalization';
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
    const translateSpy = vi.spyOn(i18n, 't');
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
    expect(translateSpy).toHaveBeenCalledTimes(1);
  });

  it('renders with a custom error message without translating', async () => {
    const translateSpy = vi.spyOn(i18n, 't');
    const wrapper = mount(Error, {
      props: {
        text: 'Custom Error Message',
        translate: false,
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await nextTick();

    // Should fail to parse the json and translate is not passed
    expect(wrapper.text()).toMatch('Custom Error Message');
    expect(translateSpy).toHaveBeenCalledTimes(0);
  });
});
