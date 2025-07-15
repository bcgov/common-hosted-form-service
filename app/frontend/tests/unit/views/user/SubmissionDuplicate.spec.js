import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SubmissionDuplicate from '~/views/user/SubmissionDuplicate.vue';

describe('SubmissionDuplicate.vue', () => {
  it('renders', () => {
    const wrapper = mount(SubmissionDuplicate, {
      props: {
        s: 's',
        f: 'f',
      },
      global: {
        stubs: {
          UserDuplicateSubmission: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('user-duplicate-submission');
  });
});
