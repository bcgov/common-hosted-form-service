import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SubmissionView from '~/views/user/SubmissionView.vue';

describe('SubmissionView.vue', () => {
  it('renders', () => {
    const wrapper = mount(SubmissionView, {
      props: {
        s: 's',
      },
      global: {
        stubs: {
          FormSubmission: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('form-submission');
  });
});
