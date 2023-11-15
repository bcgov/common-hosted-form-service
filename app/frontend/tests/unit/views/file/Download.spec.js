// @vitest-environment happy-dom
// happy-dom is required to access window.URL

import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import Download from '~/views/file/Download.vue';

describe('Download.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
  });

  it('renders and downloads json', async () => {
    const getFileSpy = vi.spyOn(Download.methods, 'getFile');
    vi.spyOn(window.URL, 'createObjectURL').mockImplementation(() => {
      return '#';
    });
    formStore.downloadFile.mockImplementation(() => {});
    formStore.downloadedFile = {
      data: '{}',
      headers: {
        'content-type': 'application/json',
        'content-disposition': 'attachment; filename=test.csv',
      },
    };
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
    expect(wrapper.html()).not.toMatch(
      'trans.download.preparingForDownloading'
    );
    expect(getFileSpy).toHaveBeenCalledTimes(1);
  });

  /* it('renders and downloads some file', async () => {
    const getFileSpy = vi.spyOn(Download.methods, 'getFile');
    vi.spyOn(window.URL, 'createObjectURL').mockImplementation(() => {
      return '#';
    });
    formStore.downloadFile.mockImplementation(() => {});
    formStore.downloadedFile = {
      data: '{}',
      headers: {
        'content-type': 'text/plain',
        'content-disposition': 'attachment; filename=test.txt',
      },
    };
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
      },
    });

    await flushPromises();

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('CHEFS Data Export');
    expect(wrapper.html()).not.toMatch('Preparing for download...');
    expect(getFileSpy).toHaveBeenCalledTimes(1);
  }); */

  it('does not render if failed download', async () => {
    const getFileSpy = vi.spyOn(Download.methods, 'getFile');
    formStore.downloadFile.mockImplementation(() => {});
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
    expect(getFileSpy).toHaveBeenCalledTimes(1);
  });
});
