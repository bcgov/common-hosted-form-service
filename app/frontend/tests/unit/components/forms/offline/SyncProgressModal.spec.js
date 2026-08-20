// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('SyncProgressModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render before drain-start', async () => {
    const wrapper = mountModal();
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(false);
  });

  it('opens on drain-start and renders every row in the pending (still-to-send) state', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    expect(wrapper.find('.dialog-stub').exists()).toBe(true);
    // Both rows start in the pending state (clock icon).
    const clocks = wrapper.findAll('.icon-mdi\\:mdi-clock-outline');
    expect(clocks).toHaveLength(2);
  });

  it('does NOT render a close button while the drain is in flight (persistent semantics)', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();
    // Neither the title-bar X (mdi:mdi-close) nor a bottom Close button (in v-card-actions) render.
    expect(wrapper.find('.icon-mdi\\:mdi-close').exists()).toBe(false);
    expect(wrapper.find('.actions-stub').exists()).toBe(false);
  });

  it('marks the matching row as sent on synced (checkmark rendered) and computes an uppercased Confirmation ID for showConfirmationId rows', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();

    managerMocks.events.emit('synced', { dedupKey: DK_A, submissionId: SUBMISSION_ID });
    await flushPromises();

    // Row A now has a checkmark; row B still has a clock.
    expect(wrapper.findAll('.icon-mdi\\:mdi-check-circle')).toHaveLength(1);
    expect(wrapper.findAll('.icon-mdi\\:mdi-clock-outline')).toHaveLength(1);
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

    managerMocks.events.emit('entry-failed', { dedupKey: DK_B, error: 'This form version was removed.' });
    await flushPromises();

    expect(wrapper.findAll('.icon-mdi\\:mdi-close-circle')).toHaveLength(1);
    expect(wrapper.text()).toContain('This form version was removed.');
  });

  it('flips to done state after drain-end (revealing the close button and actions bar)', async () => {
    const wrapper = mountModal();
    drainStartTwo();
    await flushPromises();

    expect(wrapper.vm.done).toBe(false);
    managerMocks.events.emit('drain-end', { total: 2, sent: 2, failed: 0 });
    await flushPromises();

    // done drives both the title-bar X (v-btn v-if="done") and the bottom
    // v-card-actions (v-if="done"). While drain is in flight neither renders,
    // giving the modal its persistent semantics.
    expect(wrapper.vm.done).toBe(true);
    expect(wrapper.find('.actions-stub').exists()).toBe(true);
  });
});
