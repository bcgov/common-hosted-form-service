// @vitest-environment happy-dom
// happy-dom is required to access window.URL

import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import Download from '~/views/file/Download.vue';
import * as transformUtils from '~/utils/transformUtils';
import { useAppStore } from '~/store/app';

describe('Download.vue', () => {
  let pinia;
  const getDispositionSpy = vi.spyOn(transformUtils, 'getDisposition');
  const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

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
    const appStore = useAppStore(pinia);
    appStore.$reset();
  });

  it('renders and downloads json', async () => {
    const formStore = useFormStore();
    formStore.downloadFile = vi.fn().mockImplementation((_id) => {
      formStore.downloadedFile = {
        data: '{}',
        headers: {
          'content-type': 'application/json',
          'content-disposition': 'attachment; filename=test.csv',
        },
      };
    });
    const downloadFileSpy = vi.spyOn(formStore, 'downloadFile');

    const wrapper = shallowMount(Download, {
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
          VContainer: {
            name: 'VContainer',
            template: '<div class="v-container-stub"><slot /></div>',
          },
          FormSubmission: true,
        },
      },
    });

    await flushPromises();

    expect(downloadFileSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('trans.download.chefsDataExport');
    expect(wrapper.html()).not.toMatch(
      'trans.download.preparingForDownloading'
    );
    // Assertions remain the same
    expect(getDispositionSpy).toHaveBeenCalledTimes(1);
    // Reset spy manually if needed
    formStore.downloadFile.mockClear();

    await wrapper.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it('renders and downloads text even with no data', async () => {
    const formStore = useFormStore();
    formStore.downloadFile = vi.fn().mockImplementation((_id) => {
      formStore.downloadedFile = {
        data: null,
        headers: {
          'content-type': 'content/text',
          'content-disposition': 'attachment; filename=test.csv',
        },
      };
    });
    const downloadFileSpy = vi.spyOn(formStore, 'downloadFile');

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

    expect(downloadFileSpy).toHaveBeenCalledTimes(1);
    // Assertions remain the same
    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('trans.download.chefsDataExport');
    expect(wrapper.html()).not.toMatch(
      'trans.download.preparingForDownloading'
    );
    // Assertions remain the same
    expect(getDispositionSpy).toHaveBeenCalledTimes(1);
    // Reset spy manually if needed
    formStore.downloadFile.mockClear();

    await wrapper.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it('does not render if failed download', async () => {
    const formStore = useFormStore();
    formStore.downloadFile = vi.fn().mockImplementation((_id) => {
      formStore.downloadedFile = {};
    });
    const downloadFileSpy = vi.spyOn(formStore, 'downloadFile');
    const wrapper = mount(Download, {
      props: {
        id: '1',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormSubmission: true,
        },
        plugins: [pinia],
      },
    });

    await flushPromises();

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('trans.download.chefsDataExport');
    expect(wrapper.html()).toMatch('trans.download.preparingForDownloading');
    expect(downloadFileSpy).toHaveBeenCalledTimes(1);
  });
});
