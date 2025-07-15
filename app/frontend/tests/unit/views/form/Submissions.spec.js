import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Submissions from '~/views/form/Submissions.vue';

describe('Submissions.vue', () => {
  it('renders', () => {
    const wrapper = mount(Submissions, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          SubmissionsTable: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('submissions-table');
  });
});
