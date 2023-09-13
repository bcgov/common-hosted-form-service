import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import NotFound from '~/views/NotFound.vue';

describe('NotFound.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(NotFound, {
      global: {
        stubs: {
          RouterLink: true,
        },
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.notFound.pageNotFound');
  });
});
