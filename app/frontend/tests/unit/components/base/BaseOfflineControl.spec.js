// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import BaseOfflineControl from '~/components/base/BaseOfflineControl.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const state = vi.hoisted(() => ({
  // Replaced with a real ref in beforeEach so the component's watchers fire.
  online: null,
  queueEntries: { value: [] },
  routeName: 'FormSubmit',
}));

const OFFLINE_BANNER_TEXT = 'trans.offlineSubmission.offlineBannerMessage';
const offlineBanners = () =>
  useNotificationStore().notifications.filter(
    (n) => n.text === OFFLINE_BANNER_TEXT
  );

vi.mock('vue-router', () => ({
  useRoute: () => ({ get name() { return state.routeName; } }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('~/offline/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    online: state.online,
  }),
}));

vi.mock('~/offline/queue', () => ({
  offlineQueue: { entries: state.queueEntries },
}));

vi.mock('~/components/forms/offline/PendingSubmissionsModal.vue', () => ({
  default: {
    name: 'PendingSubmissionsModal',
    props: ['modelValue'],
    template: '<div class="pending-modal-stub" />',
  },
}));

let pinia;
function mountControl() {
  return mount(BaseOfflineControl, {
    global: {
      plugins: [pinia],
    },
  });
}

describe('BaseOfflineControl.vue', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    state.online = ref(true);
    state.queueEntries.value = [];
    state.routeName = 'FormSubmit';
  });

  it('is not visible when form is not offline-enabled and queue is empty', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = false;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(false);
  });

  it('is visible when queue has items even without an offline form', async () => {
    state.queueEntries.value = [{}];
    const store = useFormStore();
    store.form.enableOfflineSubmission = false;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(true);
  });

  it('is visible on submitter routes when the form is offline-enabled', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(true);
  });

  it('is hidden on non-submitter routes (editor, list of forms, etc.)', async () => {
    state.routeName = 'FormDesigner';
    state.queueEntries.value = [{}];
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(false);
  });

  it('reflects queue count', async () => {
    state.queueEntries.value = [{}, {}, {}];
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.queuedCount).toBe(3);
  });

  it('opens the pending modal when openQueue runs', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.showPending).toBe(false);
    wrapper.vm.openQueue();
    expect(wrapper.vm.showPending).toBe(true);
  });

  describe('offline banner', () => {
    it('is not raised while online', async () => {
      useFormStore().form.enableOfflineSubmission = true;

      mountControl();
      await flushPromises();

      expect(offlineBanners()).toHaveLength(0);
    });

    it('is raised on initial load when already offline', async () => {
      state.online.value = false;
      useFormStore().form.enableOfflineSubmission = true;

      mountControl();
      await flushPromises();

      expect(offlineBanners()).toHaveLength(1);
      expect(offlineBanners()[0].retain).toBe(true);
    });

    it('is raised when going offline on an offline-capable page', async () => {
      useFormStore().form.enableOfflineSubmission = true;

      mountControl();
      await flushPromises();
      state.online.value = false;
      await flushPromises();

      expect(offlineBanners()).toHaveLength(1);
    });

    it('is raised when the control becomes visible while already offline', async () => {
      state.online.value = false;
      const store = useFormStore();
      store.form.enableOfflineSubmission = false;

      mountControl();
      await flushPromises();
      expect(offlineBanners()).toHaveLength(0);

      // e.g. the offline-capable form finishes loading after mount
      store.form.enableOfflineSubmission = true;
      await flushPromises();

      expect(offlineBanners()).toHaveLength(1);
    });

    it('is cleared when back online', async () => {
      state.online.value = false;
      useFormStore().form.enableOfflineSubmission = true;

      mountControl();
      await flushPromises();
      expect(offlineBanners()).toHaveLength(1);

      state.online.value = true;
      await flushPromises();

      expect(offlineBanners()).toHaveLength(0);
    });

    it('is cleared when leaving the offline-capable page and leaves other notifications alone', async () => {
      state.online.value = false;
      const store = useFormStore();
      store.form.enableOfflineSubmission = true;
      useNotificationStore().addNotification({ text: 'some other toast' });

      mountControl();
      await flushPromises();
      expect(offlineBanners()).toHaveLength(1);

      store.form.enableOfflineSubmission = false;
      await flushPromises();

      expect(offlineBanners()).toHaveLength(0);
      expect(useNotificationStore().notifications).toHaveLength(1);
    });
  });
});
