// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoute } from 'vue-router';

import BaseOfflineControl from '~/components/base/BaseOfflineControl.vue';
import { useFormStore } from '~/store/form';

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}));

const state = vi.hoisted(() => ({
  networkOnline: { value: true },
  simulatingOffline: { value: false },
  canSimulateOffline: { value: true },
  queueEntries: { value: [] },
}));

vi.mock('~/offline/useSimulationToggle', () => ({
  useSimulationToggle: () => ({
    networkOnline: state.networkOnline,
    canSimulateOffline: state.canSimulateOffline,
    simulatingOffline: state.simulatingOffline,
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
    state.networkOnline.value = true;
    state.simulatingOffline.value = false;
    state.canSimulateOffline.value = true;
    state.queueEntries.value = [];
    useRoute.mockReturnValue({ name: 'FormSubmit', query: {} });
  });

  it('is not visible when the form is not offline-enabled', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = false;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(false);
  });

  it('is not visible when route is not a form-submit page', async () => {
    useRoute.mockReturnValue({ name: 'FormsList', query: {} });
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(false);
  });

  it('renders the online state with chevron when simulation is available', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.visible).toBe(true);
    expect(wrapper.vm.state.label).toBe('trans.offlineSubmission.onlineBadge');
    expect(wrapper.vm.showChevron).toBe(true);
  });

  it('hides the chevron when real network is offline', async () => {
    state.networkOnline.value = false;
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.state.label).toBe('trans.offlineSubmission.offlineBadge');
    expect(wrapper.vm.showChevron).toBe(false);
  });

  it('shows simulating-offline state when the toggle is on', async () => {
    state.simulatingOffline.value = true;
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    expect(wrapper.vm.state.label).toBe(
      'trans.offlineSubmission.simulatingBadge'
    );
    expect(wrapper.vm.state.variant).toBe('outlined');
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

  it('toggles simulatingOffline when toggleSimulate runs', async () => {
    const store = useFormStore();
    store.form.enableOfflineSubmission = true;

    const wrapper = mountControl();
    await flushPromises();

    wrapper.vm.toggleSimulate();
    expect(state.simulatingOffline.value).toBe(true);

    wrapper.vm.toggleSimulate();
    expect(state.simulatingOffline.value).toBe(false);
  });
});
