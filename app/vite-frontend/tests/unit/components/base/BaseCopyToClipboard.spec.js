import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';

import Clipboard from 'vue3-clipboard';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import { useNotificationStore } from '~/store/notification';

describe('BaseCopyToClipboard.vue', () => {
  setActivePinia(createPinia());
  const store = useNotificationStore();
  const addNotificationSpy = vi.spyOn(store, 'addNotification');

  beforeEach(async () => {
    store.$reset();
    addNotificationSpy.mockReset();
  });

  it('renders', () => {
    const wrapper = mount(BaseCopyToClipboard, {
      props: {
        tooltipText: 'test',
        textToCopy: 'test',
        buttonText: 'test',
      },
      global: {
        plugins: [[Clipboard, { autoSetContainer: true, appendToBody: true }]],
      },
      store,
    });

    expect(wrapper.text()).toEqual('test');
  });

  it('clipboardSuccessHandler behaves correctly', async () => {
    const wrapper = mount(BaseCopyToClipboard, {
      props: {
        snackBarText: 'test',
        tooltipText: 'test',
        textToCopy: 'test',
        buttonText: 'test',
      },
      global: {
        plugins: [[Clipboard, { autoSetContainer: true, appendToBody: true }]],
      },
      store,
    });

    await wrapper.find('button').trigger('click');
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
