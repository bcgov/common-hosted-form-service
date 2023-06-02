import { createLocalVue, shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import Submissions from '@/views/form/Submissions.vue';

const localVue = createLocalVue();

describe('Submissions.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Submissions, {
      localVue,
      propsData: { f: 'f' },
      stubs: ['BaseSecure', 'SubmissionsTable'],
      i18n
    });

    expect(wrapper.html()).toMatch('submissionstable');
  });
});
