import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';

import UserDuplicateSubmission from '~/components/forms/submission/UserDuplicateSubmission.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

const STUBS = {
  VSkeletonLoader: {
    template: '<div class="v-skeleton-loader-stub"><slot /></div>',
  },
};

describe('UserDuplicateSubmission.vue', () => {
  const formId = '123-456';
  const submissionId = '123-456';

  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    appStore.$reset();
  });

  it('renders', async () => {
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(UserDuplicateSubmission, {
      props: {
        formId: formId,
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('form-viewer-stub');
  });
});
