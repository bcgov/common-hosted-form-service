// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BaseOfflineControl from '~/components/base/BaseOfflineControl.vue';
import { useFormStore } from '~/store/form';

const state = vi.hoisted(() => ({
  online: { value: true },
  queueEntries: { value: [] },
  routeName: 'FormSubmit',
}));

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
    state.online.value = true;
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

  it('renders the online state when reachable', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(true);
    expect(wrapper.vm.state.label).toBe('trans.offlineSubmission.onlineBadge');
  });

  it('renders the offline state when unreachable (network down or heartbeat failing)', async () => {
    state.online.value = false;
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.state.label).toBe('trans.offlineSubmission.offlineBadge');
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
});
