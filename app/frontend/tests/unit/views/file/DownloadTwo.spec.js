// @vitest-environment happy-dom
// happy-dom is required to access window.URL

import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import Download from '~/views/file/Download.vue';

describe('Download.vue', () => {
  let pinia;

  beforeEach(() => {
    // Create a new instance of Pinia for each test to ensure complete isolation
    pinia = createTestingPinia({
      // Use createPinia instead of the singleton to ensure a fresh store
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    // Reset all mocks/spies
    vi.resetAllMocks();

    // Explicitly mock/spy on global functions
    vi.spyOn(window.URL, 'createObjectURL').mockImplementation(() => '#');
  });

  afterEach(() => {
    // Reset the Pinia stores after each test
    const formStore = useFormStore();
    formStore.$reset();
    const notificationStore = useNotificationStore();
    notificationStore.$reset();
  });

  it('renders and downloads json even with no data', async () => {
    const formStore = useFormStore();
    formStore.downloadFile = vi.fn().mockImplementation(() => {});
    formStore.downloadedFile = {
      data: '{}',
      headers: {
        'content-type': 'application/json',
        'content-disposition': 'attachment; filename=test.csv',
      },
    };

    const getFileSpy = vi.spyOn(Download.methods, 'getFile');
    const getDispositionSpy = vi.spyOn(Download.methods, 'getDisposition');

    const wrapper = mount(Download, {
      props: {
        id: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSubmission: true,
        },
      },
    });

    await flushPromises();

    // Assertions remain the same
    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('trans.download.chefsDataExport');
    expect(wrapper.html()).not.toMatch(
      'trans.download.preparingForDownloading'
    );
    expect(getFileSpy).toHaveBeenCalledTimes(1);
    expect(getDispositionSpy).toHaveBeenCalledTimes(1);
    // Reset spy manually if needed
    getFileSpy.mockClear();
  });
});
