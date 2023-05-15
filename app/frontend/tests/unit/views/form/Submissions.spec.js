import { createLocalVue, shallowMount } from '@vue/test-utils';

import Submissions from '@/views/form/Submissions.vue';

const localVue = createLocalVue();

describe('Submissions.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Submissions, {
      localVue,
      propsData: { f: 'f' },
      stubs: ['BaseSecure', 'SubmissionsTable'],
    });

    expect(wrapper.html()).toMatch('submissionstable');
  });
});
