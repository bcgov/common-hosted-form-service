import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';

import { formService } from '~/services';
import StatusTable from '~/components/forms/submission/StatusTable.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

describe('StatusTable.vue', () => {
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
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    const wrapper = mount(StatusTable, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('trans.statusTable.status');
    expect(wrapper.html()).toContain('trans.statusTable.dateStatusChanged');
    expect(wrapper.html()).toContain('trans.statusTable.assignee');
    expect(wrapper.html()).toContain('trans.statusTable.updatedBy');
  });

  it('getData addsNotification if error is thrown', async () => {
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    addNotificationSpy.mockImplementationOnce(() => {});

    shallowMount(StatusTable, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
});
