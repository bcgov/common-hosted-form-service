import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';
import { useRouter } from 'vue-router';

import UserSubmission from '~/components/forms/submission/UserSubmission.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: () => {},
  })),
}));

const STUBS = {
  VSkeletonLoader: {
    template: '<div class="v-skeleton-loader-stub"><slot /></div>',
  },
  VContainer: {
    template: '<div class="v-container-stub"><slot /></div>',
  },
};

describe('UserSubmission.vue', () => {
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
    const wrapper = shallowMount(UserSubmission, {
      props: {
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

  it('redirects user if we are on the draft page and submission is already submitted', async () => {
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    formStore.formSubmission = {
      submission: {
        state: 'submitted',
      },
    };
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = shallowMount(UserSubmission, {
      props: {
        submissionId: submissionId,
        draft: true,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('form-viewer-stub');
    expect(push).toHaveBeenCalledTimes(1);
  });
});
