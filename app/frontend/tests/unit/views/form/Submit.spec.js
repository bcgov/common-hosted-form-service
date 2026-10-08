import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Submit from '~/views/form/Submit.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}));

describe('Submit.vue', () => {
  it('renders', () => {
    const wrapper = mount(Submit, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          FormViewer: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('form-viewer');
  });
});
