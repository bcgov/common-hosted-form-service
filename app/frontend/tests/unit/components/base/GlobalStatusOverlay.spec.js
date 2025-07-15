import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GlobalStatusOverlay from '~/components/base/GlobalStatusOverlay.vue';

describe('GlobalStatusOverlay', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(GlobalStatusOverlay, {
      props: { parentReady: false },
      global: {
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
    const button = wrapper.find('button.info-links');
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
    const button = wrapper.find('button.info-links');
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
    const button = wrapper.find('button.info-links');
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
    const button = wrapper.find('button.info-links');
    await button.trigger('click');

    expect(wrapper.text()).toContain('shuttingDown');
  });

  it('shows overlay with not ready message', async () => {
    wrapper.vm.setStatusOverlay({ ready: false });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.status-overlay').exists()).toBe(true);
    // Find and click the Show More Info button
    const button = wrapper.find('button.info-links');
    await button.trigger('click');

    expect(wrapper.text()).toContain('notReady');
  });
});
