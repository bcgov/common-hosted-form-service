// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const managerMocks = vi.hoisted(() => ({ events: null }));
vi.mock('~/offline/offlineQueueManager', async () => {
  const mitt = (await import('mitt')).default;
  managerMocks.events = mitt();
  return { offlineQueueEvents: managerMocks.events };
});

import SyncProgressModal from '~/components/forms/offline/SyncProgressModal.vue';

function mountModal() {
  return mount(SyncProgressModal, {
    global: {
      stubs: {
        'v-dialog': {
          props: ['modelValue'],
          template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>',
        },
        'v-card': { template: '<div><slot /></div>' },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-actions': { template: '<div class="actions-stub"><slot /></div>' },
        'v-spacer': true,
        'v-progress-linear': true,
        'v-chip': { template: '<span><slot /></span>' },
        'v-icon': {
          inheritAttrs: false,
          template: '<i v-bind="$attrs" :class="`icon-${$attrs.icon}`"></i>',
        },
        'v-btn': {
          inheritAttrs: false,
          template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
        },
        'i18n-t': {
          props: ['keypath', 'tag'],
          template: '<span><slot name="formName" /></span>',
        },
      },
    },
  });
}

const DK_A = 'dk-aaaaaaaaaaaa';
const DK_B = 'dk-bbbbbbbbbbbb';
// A real UUID for row A so we can assert on confirmationId(row).substring(0,8).toUpperCase().
const SUBMISSION_ID = 'abcdef01-2345-4678-8901-234567890123';

function drainStartTwo() {
  managerMocks.events.emit('drain-start', {
    total: 2,
    entries: [
      { dedupKey: DK_A, formName: 'Contact', queuedAt: new Date().toISOString(), showConfirmationId: true, body: { draft: false } },
      { dedupKey: DK_B, formName: 'Contact', queuedAt: new Date().toISOString(), showConfirmationId: false, body: { draft: false } },
    ],
  });
}

const MIN_SPINNER_MS = 2000;

const icons = (wrapper, name) => wrapper.findAll(`.icon-mdi\\:mdi-${name}`);

async function elapseMinimum() {
  vi.advanceTimersByTime(MIN_SPINNER_MS);
  await flushPromises();
}

describe('SyncProgressModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Fake only the timer APIs the minimum hold uses; flushPromises relies on
    // setImmediate, which must stay real.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render before drain-start', async () => {
    const wrapper = mountModal();
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(false);
  });

  it('opens on drain-start with the spinner up and every row in the pending (still-to-send) state', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(true);
    expect(wrapper.vm.spinnerVisible).toBe(true);
    expect(icons(wrapper, 'clock-outline')).toHaveLength(2);
  });

  it('holds row icons, the sent count, and the done state at pending until the minimum elapses on a fast drain', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();

    managerMocks.events.emit('synced', { dedupKey: DK_A, submissionId: SUBMISSION_ID });
    managerMocks.events.emit('entry-failed', { dedupKey: DK_B, error: 'This form version was removed.' });
    managerMocks.events.emit('drain-progress', { total: 2, sent: 1, failed: 1 });
    managerMocks.events.emit('drain-end', { total: 2, sent: 1, failed: 1 });
    await flushPromises();

    // Drain is already over, but nothing reveals it yet.
    expect(wrapper.vm.done).toBe(true);
    expect(wrapper.vm.spinnerVisible).toBe(true);
    expect(icons(wrapper, 'clock-outline')).toHaveLength(2);
    expect(icons(wrapper, 'check-circle')).toHaveLength(0);
    expect(icons(wrapper, 'close-circle')).toHaveLength(0);
    expect(wrapper.text()).not.toContain('This form version was removed.');
    expect(wrapper.vm.shownSent).toBe(0);
    expect(wrapper.find('.actions-stub').exists()).toBe(false);

    vi.advanceTimersByTime(MIN_SPINNER_MS - 1);
    await flushPromises();
    expect(icons(wrapper, 'clock-outline')).toHaveLength(2);
    expect(wrapper.find('.actions-stub').exists()).toBe(false);

    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(wrapper.vm.spinnerVisible).toBe(false);
    expect(icons(wrapper, 'check-circle')).toHaveLength(1);
    expect(icons(wrapper, 'close-circle')).toHaveLength(1);
    expect(wrapper.text()).toContain('This form version was removed.');
    expect(wrapper.vm.shownSent).toBe(1);
    expect(wrapper.find('.actions-stub').exists()).toBe(true);
  });

  it('updates rows live once the minimum has elapsed on a slow drain, and keeps spinning until drain-end', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    await elapseMinimum();

    // Still draining: spinner stays, nothing flipped yet.
    expect(wrapper.vm.spinnerVisible).toBe(true);
    expect(icons(wrapper, 'clock-outline')).toHaveLength(2);

    managerMocks.events.emit('synced', { dedupKey: DK_A, submissionId: SUBMISSION_ID });
    await flushPromises();
    expect(icons(wrapper, 'check-circle')).toHaveLength(1);
    expect(icons(wrapper, 'clock-outline')).toHaveLength(1);
    expect(wrapper.vm.spinnerVisible).toBe(true);
    expect(wrapper.find('.actions-stub').exists()).toBe(false);

    managerMocks.events.emit('synced', { dedupKey: DK_B, submissionId: SUBMISSION_ID });
    managerMocks.events.emit('drain-end', { total: 2, sent: 2, failed: 0 });
    await flushPromises();
    expect(icons(wrapper, 'check-circle')).toHaveLength(2);
    expect(wrapper.vm.spinnerVisible).toBe(false);
    expect(wrapper.find('.actions-stub').exists()).toBe(true);
  });

  it('restarts the minimum hold for a new drain after the previous one was closed', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    managerMocks.events.emit('drain-end', { total: 2, sent: 2, failed: 0 });
    await elapseMinimum();
    wrapper.vm.close();
    await flushPromises();

    drainStartTwo();
    await flushPromises();
    managerMocks.events.emit('synced', { dedupKey: DK_A, submissionId: SUBMISSION_ID });
    managerMocks.events.emit('drain-end', { total: 2, sent: 1, failed: 0 });
    await flushPromises();
    expect(wrapper.vm.spinnerVisible).toBe(true);
    expect(icons(wrapper, 'check-circle')).toHaveLength(0);
    expect(wrapper.find('.actions-stub').exists()).toBe(false);
  });

  it('does NOT render a close button while the drain is in flight (persistent semantics)', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    await elapseMinimum();
    // Neither the title-bar X (mdi:mdi-close) nor a bottom Close button (in v-card-actions) render.
    expect(wrapper.find('button[icon="mdi:mdi-close"]').exists()).toBe(false);
    expect(wrapper.find('.actions-stub').exists()).toBe(false);
  });

  it('marks the matching row as sent on synced (checkmark rendered) and computes an uppercased Confirmation ID for showConfirmationId rows', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    await elapseMinimum();

    managerMocks.events.emit('synced', { dedupKey: DK_A, submissionId: SUBMISSION_ID });
    await flushPromises();

    // Row A now has a checkmark; row B still has a clock.
    expect(icons(wrapper, 'check-circle')).toHaveLength(1);
    expect(icons(wrapper, 'clock-outline')).toHaveLength(1);
    // The i18n stub returns the raw key without interpolation, so we can't
    // assert on the rendered ID text. Instead assert on the confirmationId
    // transform directly: first 8 chars, uppercased, only when the row opts in.
    const row = wrapper.vm.rows.find((r) => r.dedupKey === DK_A);
    expect(row.submissionId).toBe(SUBMISSION_ID);
    expect(wrapper.vm.confirmationId(row)).toBe(SUBMISSION_ID.substring(0, 8).toUpperCase());
    // Row B did not opt in: its confirmationId is null even if synced later.
    const rowB = wrapper.vm.rows.find((r) => r.dedupKey === DK_B);
    rowB.submissionId = 'zz112233-4444-4555-8666-777777777777';
    expect(wrapper.vm.confirmationId(rowB)).toBeNull();
  });

  it('marks the matching row as failed on entry-failed and surfaces the error text', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    await elapseMinimum();

    managerMocks.events.emit('entry-failed', { dedupKey: DK_B, error: 'This form version was removed.' });
    await flushPromises();

    expect(icons(wrapper, 'close-circle')).toHaveLength(1);
    expect(wrapper.text()).toContain('This form version was removed.');
  });

  it('flips to done state after drain-end (revealing the close button and actions bar)', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();

    expect(wrapper.vm.done).toBe(false);
    managerMocks.events.emit('drain-end', { total: 2, sent: 2, failed: 0 });
    await elapseMinimum();

    // showResults (done + spinner off) drives both the title-bar X and the
    // bottom v-card-actions. Until then neither renders, giving the modal its
    // persistent semantics.
    expect(wrapper.vm.done).toBe(true);
    expect(wrapper.find('button[icon="mdi:mdi-close"]').exists()).toBe(true);
    expect(wrapper.find('.actions-stub').exists()).toBe(true);
  });
});
