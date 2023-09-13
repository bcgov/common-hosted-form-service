import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import Preview from '~/views/form/Preview.vue';

describe('Preview.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(Preview, {
      props: {
        f: 'f',
        d: 'd',
        v: 'v',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormViewer: true,
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
        },
        plugins: [pinia],
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('trans.preview.preview');
    expect(wrapper.html()).toMatch('trans.preview.previewToolTip');
    expect(wrapper.html()).toMatch('form-viewer');
  });
});
