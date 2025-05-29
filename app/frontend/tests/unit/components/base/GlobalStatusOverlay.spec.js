import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GlobalStatusOverlay from '~/components/base/GlobalStatusOverlay.vue';

describe('GlobalStatusOverlay', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(GlobalStatusOverlay, {
      props: { parentReady: false },
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('does not show overlay by default', () => {
    expect(wrapper.find('.status-overlay').exists()).toBe(false);
  });

  it('shows overlay with service unavailable message on event', async () => {
    window.dispatchEvent(
      new CustomEvent('service-unavailable', {
        detail: 'error',
      })
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain(
      'trans.statusOverlay.defaultStatusMessage'
    );
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
            },
          },
        },
      })
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('trans.statusOverlay.notReady');
    // Check for Disconnected status
    expect(wrapper.text()).toContain('trans.statusOverlay.disconnected');
  });

  it('shows overlay with shutdown message when stopped', async () => {
    // Simulate backend status with stopped=true
    wrapper.vm.setStatusOverlay({ stopped: true, contact: 'test@example.com' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('trans.statusOverlay.shuttingDown');
    expect(wrapper.text()).toContain(
      'trans.statusOverlay.contact: test@example.com'
    );
  });

  it('shows overlay with not ready message', async () => {
    wrapper.vm.setStatusOverlay({ ready: false });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('trans.statusOverlay.notReady');
  });
});
