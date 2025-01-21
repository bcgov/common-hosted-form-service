import { createTestingPinia } from '@pinia/testing';
import { shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import DeleteSubmission from '~/components/forms/submission/DeleteSubmission.vue';
import { useFormStore } from '~/store/form';
import { beforeEach, vi } from 'vitest';

describe('DeleteSubmission.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('delSub should call deleteSubmission and then emit deleted', async () => {
    const deleteSubmissionSpy = vi.spyOn(formStore, 'deleteSubmission');
    deleteSubmissionSpy.mockImplementation(async () => {});
    const wrapper = shallowMount(DeleteSubmission, {
      props: {
        submissionId: '1',
      },
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.vm.delSub();

    expect(deleteSubmissionSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted()).toHaveProperty('deleted');
  });
});
