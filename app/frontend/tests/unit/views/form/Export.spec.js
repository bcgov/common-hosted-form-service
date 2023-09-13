import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Export from '~/views/form/Export.vue';

describe('Export.vue', () => {
  it('renders', () => {
    const wrapper = mount(Export, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          ExportSubmissions: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('export-submissions');
  });
});
