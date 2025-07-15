import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import View from '~/views/form/View.vue';

describe('View.vue', () => {
  it('renders', () => {
    const wrapper = mount(View, {
      props: {
        s: 's',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSubmission: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('form-submission');
  });
});
