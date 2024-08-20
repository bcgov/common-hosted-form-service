import { createTestingPinia } from '@pinia/testing';
import { shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';

import AuditHistory from '~/components/forms/submission/AuditHistory.vue';
import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';

describe('AuditHistory.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const notificationStore = useNotificationStore(pinia);

  beforeEach(() => {
    notificationStore.$reset();
  });

  it('should load submission edits', async () => {
    const listSubmissionEditsSpy = vi.spyOn(formService, 'listSubmissionEdits');
    listSubmissionEditsSpy.mockImplementationOnce(async () => {});
    const wrapper = shallowMount(AuditHistory, {
      props: {
        submissionId: '1',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.loadHistory();

    expect(listSubmissionEditsSpy).toHaveBeenCalledTimes(1);
  });

  it('should add a notification if it fails to list submission edits', async () => {
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const listSubmissionEditsSpy = vi.spyOn(formService, 'listSubmissionEdits');
    listSubmissionEditsSpy.mockRejectedValue({});
    const wrapper = shallowMount(AuditHistory, {
      props: {
        submissionId: '1',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.loadHistory();

    expect(listSubmissionEditsSpy).toHaveBeenCalledTimes(1);
    expect(listSubmissionEditsSpy).rejects.toEqual({});
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
