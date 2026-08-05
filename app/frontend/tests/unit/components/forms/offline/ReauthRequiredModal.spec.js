// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const managerMocks = vi.hoisted(() => ({
  events: null,
  tryDrain: vi.fn(),
}));

vi.mock('~/offline/offlineQueueManager', async () => {
  const mitt = (await import('mitt')).default;
  managerMocks.events = mitt();
  return {
    offlineQueueEvents: managerMocks.events,
    tryDrain: managerMocks.tryDrain,
    REAUTH_PENDING_SS_KEY: 'chefs_offline_pending_reauth_drain',
    REAUTH_SNOOZE_SS_KEY: 'chefs_offline_reauth_snoozed',
  };
});

const authMocks = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('~/store/auth', () => ({
  useAuthStore: () => authMocks,
}));

import ReauthRequiredModal from '~/components/forms/offline/ReauthRequiredModal.vue';

function mountModal() {
  return mount(ReauthRequiredModal, {
    global: {
      stubs: {
        'v-dialog': {
          props: ['modelValue'],
          template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>',
        },
        'v-card': { template: '<div class="card-stub"><slot /></div>' },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
        'v-card-actions': { template: '<div><slot /></div>' },
        'v-spacer': true,
        'v-btn': {
          template: '<button v-bind="$attrs"><slot /></button>',
        },
      },
    },
  });
}

describe('ReauthRequiredModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    authMocks.login.mockClear();
    managerMocks.tryDrain.mockClear();
  });

  it('does not render before an event fires', async () => {
    const wrapper = mountModal();
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(false);
  });

  it('opens the auth prompt on auth-required event', async () => {
    const wrapper = mountModal();
    managerMocks.events.emit('auth-required', { queuedCount: 3 });
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(true);
    expect(wrapper.vm.mode).toBe('auth');
    expect(wrapper.vm.count).toBe(3);
  });

  it('signIn sets the post-login flag and calls authStore.login', async () => {
    const wrapper = mountModal();
    managerMocks.events.emit('auth-required', { queuedCount: 2 });
    await flushPromises();

    wrapper.vm.signIn();

    expect(sessionStorage.getItem('chefs_offline_pending_reauth_drain')).toBe(
      '1'
    );
    expect(authMocks.login).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.mode).toBe(null);
  });

  it('notNow sets the snooze flag and closes without calling login', async () => {
    const wrapper = mountModal();
    managerMocks.events.emit('auth-required', { queuedCount: 1 });
    await flushPromises();

    wrapper.vm.notNow();

    expect(sessionStorage.getItem('chefs_offline_reauth_snoozed')).toBe('1');
    expect(authMocks.login).not.toHaveBeenCalled();
    expect(wrapper.vm.mode).toBe(null);
  });

  it('opens the confirm prompt on reauth-drain-confirm and Send calls tryDrain', async () => {
    const wrapper = mountModal();
    managerMocks.events.emit('reauth-drain-confirm', { queuedCount: 4 });
    await flushPromises();

    expect(wrapper.vm.mode).toBe('confirm');
    expect(wrapper.vm.count).toBe(4);

    wrapper.vm.send();

    expect(managerMocks.tryDrain).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.mode).toBe(null);
  });
});
