import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SubmissionDraftEdit from '~/views/user/SubmissionDraftEdit.vue';

describe('SubmissionDraftEdit.vue', () => {
  it('renders', () => {
    const wrapper = mount(SubmissionDraftEdit, {
      props: {
        s: 's',
      },
      global: {
        stubs: {
          UserSubmission: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('user-submission');
  });
});
