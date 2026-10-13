import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// Intercept appAxios BEFORE the component is imported so pollStatus reads our mock.
const axiosMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));
vi.mock('~/services/interceptors', () => ({
  appAxios: () => ({ get: axiosMocks.get }),
}));

import GlobalStatusOverlay from '~/components/base/GlobalStatusOverlay.vue';
import { reachable } from '~/offline/useReachability';
import { useFormStore } from '~/store/form';

describe('GlobalStatusOverlay', () => {
  let wrapper;
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    wrapper = mount(GlobalStatusOverlay, {
      props: { parentReady: false },
      global: {
        plugins: [pinia],
        stubs: {
          'i18n-t': true,
        },
      },
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('does not show overlay by default', () => {
    expect(wrapper.find('.status-overlay').exists()).toBe(false);
  });

  it('shows more info section when Show More Info is clicked', async () => {
    // Simulate overlay being shown
    wrapper.vm.setStatusOverlay({
      ready: false,
      connections: {
        dataConnection: {
          connected: false,
          started: true,
          displayName: 'Data Connection',
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Click the Show More Info button
    const button = wrapper.find('[data-test="more-info-button"]');
    await button.trigger('click');

    // Assert the more info section is visible
    expect(wrapper.text()).toContain('moreInfoIntro');
    // Optionally, check for the table or other details
    expect(wrapper.find('.status-connections-table').exists()).toBe(true);
  });

  it('shows overlay with service unavailable message on event', async () => {
    window.dispatchEvent(
      new CustomEvent('service-unavailable', {
        detail: 'error',
      })
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    // Find and click the Show More Info button
    const button = wrapper.find('[data-test="more-info-button"]');
    await button.trigger('click');

    expect(wrapper.text()).toContain('defaultStatusMessage');
  });

  it('shows overlay with service not ready on event with detail.ready=false', async () => {
    window.dispatchEvent(
      new CustomEvent('service-unavailable', {
        detail: {
          message: 'Server is not ready',
          ready: false,
          stopped: false,
          connections: {
            dataConnection: {
              connected: false,
              started: true,
              displayName: 'Data Connection',
            },
          },
        },
      })
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    // Find and click the Show More Info button
    const button = wrapper.find('[data-test="more-info-button"]');
    await button.trigger('click');

    expect(wrapper.text()).toContain('notReady');
    // Check for Disconnected status
    expect(wrapper.text()).toContain('disconnected');
  });

  it('shows overlay with shutdown message when stopped', async () => {
    // Simulate backend status with stopped=true
    wrapper.vm.setStatusOverlay({ stopped: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    // Find and click the Show More Info button
    const button = wrapper.find('[data-test="more-info-button"]');
    await button.trigger('click');

    expect(wrapper.text()).toContain('shuttingDown');
  });

  it('shows overlay with not ready message', async () => {
    wrapper.vm.setStatusOverlay({ ready: false });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    // Find and click the Show More Info button
    const button = wrapper.find('[data-test="more-info-button"]');
    await button.trigger('click');

    expect(wrapper.text()).toContain('notReady');
  });

  describe('offline-form suppression predicate', () => {
    // These tests remount with parentReady=true so pollStatus actually runs
    // (the default beforeEach mount uses parentReady=false to keep the
    // existing static tests deterministic).
    let localWrapper;

    afterEach(() => {
      if (localWrapper) localWrapper.unmount();
      reachable.value = true;
      axiosMocks.get.mockReset();
    });

    async function mountForOfflineFlow({ enableOfflineSubmission }) {
      const localPinia = createPinia();
      setActivePinia(localPinia);
      const store = useFormStore();
      store.form.enableOfflineSubmission = enableOfflineSubmission;
      localWrapper = mount(GlobalStatusOverlay, {
        props: { parentReady: true },
        global: {
          plugins: [localPinia],
          stubs: { 'i18n-t': true },
        },
      });
      await flushPromises();
      return localWrapper;
    }

    it('suppresses the overlay when reachable is false on an offline-enabled form (defer to the offline chip)', async () => {
      // reachable already false at mount: pollStatus takes the early return
      // BEFORE hitting appAxios, and setStatusOverlay is never called.
      reachable.value = false;
      axiosMocks.get.mockRejectedValue(new Error('should not be called'));
      const w = await mountForOfflineFlow({ enableOfflineSubmission: true });

      expect(w.vm.showOverlay).toBe(false);
      expect(w.find('.status-overlay').exists()).toBe(false);
      // Load-bearing: no /status call while offline chip is already communicating the state.
      expect(axiosMocks.get).not.toHaveBeenCalled();
    });

    it('still shows the overlay when reachable is false on a NON-offline form (admin, login, etc.)', async () => {
      // Non-offline forms have no offline UX to defer to, so the overlay must
      // still surface a network problem the way it always has.
      reachable.value = false;
      axiosMocks.get.mockRejectedValue(new Error('network down'));
      const w = await mountForOfflineFlow({ enableOfflineSubmission: false });

      // pollStatus ran, appAxios rejected, setStatusOverlay flipped showOverlay on.
      expect(axiosMocks.get).toHaveBeenCalledTimes(1);
      expect(w.vm.showOverlay).toBe(true);
    });

    it('re-runs pollStatus immediately when reachable flips false → true (no 60s wait)', async () => {
      reachable.value = false;
      axiosMocks.get.mockResolvedValue({ data: { ready: true } });
      const w = await mountForOfflineFlow({ enableOfflineSubmission: true });
      expect(axiosMocks.get).not.toHaveBeenCalled();

      reachable.value = true;
      await flushPromises();

      // Watch fired; pollStatus ran without waiting for the interval tick.
      expect(axiosMocks.get).toHaveBeenCalledTimes(1);
      expect(w.vm.showOverlay).toBe(false);
    });
  });
});
