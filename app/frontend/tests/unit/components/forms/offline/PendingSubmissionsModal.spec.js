// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const queueMocks = vi.hoisted(() => ({
  entries: { value: [] },
  remove: vi.fn(async () => {}),
}));
vi.mock('~/offline/queue', () => ({
  offlineQueue: {
    entries: queueMocks.entries,
    remove: queueMocks.remove,
  },
  QueueStatus: {
    PENDING: 'pending',
    SYNCING: 'syncing',
    FAILED_AUTH: 'failed-auth',
    FAILED_PERMISSION: 'failed-permission',
    FAILED_IDENTITY_MISMATCH: 'failed-identity-mismatch',
    FAILED_VERSION_GONE: 'failed-version-gone',
    FAILED_VALIDATION: 'failed-validation',
  },
}));

const managerMocks = vi.hoisted(() => ({
  tryDrain: vi.fn(),
  clearReauthSnooze: vi.fn(),
  isDraining: { value: false },
}));
vi.mock('~/offline/offlineQueueManager', () => ({
  tryDrain: managerMocks.tryDrain,
  clearReauthSnooze: managerMocks.clearReauthSnooze,
  isDraining: managerMocks.isDraining,
}));

const onlineMocks = vi.hoisted(() => ({ online: { value: true } }));
vi.mock('~/offline/useOnlineStatus', () => ({
  useOnlineStatus: () => ({ online: onlineMocks.online }),
}));

import PendingSubmissionsModal from '~/components/forms/offline/PendingSubmissionsModal.vue';

function mountModal() {
  return mount(PendingSubmissionsModal, {
    props: { modelValue: true },
    global: {
      stubs: {
        // Render modal contents inline so we can inspect them without portals.
        'v-dialog': {
          props: ['modelValue'],
          template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>',
        },
        'v-card': { template: '<div><slot /></div>' },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
        'v-card-actions': { template: '<div><slot /></div>' },
        'v-spacer': true,
        'v-chip': { template: '<span class="chip-stub"><slot /></span>' },
        'v-btn': {
          inheritAttrs: false,
          template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
        },
        // Render the i18n-t default slot with the formName strong so the assert
        // on visible text works without pulling in vue-i18n's renderer.
        'i18n-t': {
          props: ['keypath', 'tag'],
          template: '<span><slot name="formName" /></span>',
        },
      },
    },
  });
}

const PENDING_ID = '11111111-1111-4111-8111-111111111111';
const SYNCING_ID = '22222222-2222-4222-8222-222222222222';
const NOTED_ID = '33333333-3333-4333-8333-333333333333';

describe('PendingSubmissionsModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    queueMocks.remove.mockClear();
    onlineMocks.online.value = true;
    queueMocks.entries.value = [
      {
        id: PENDING_ID,
        formName: 'Contact Form',
        status: 'pending',
        queuedAt: new Date().toISOString(),
        body: { draft: false },
      },
      {
        id: SYNCING_ID,
        formName: 'Contact Form',
        status: 'syncing',
        queuedAt: new Date().toISOString(),
        body: { draft: false },
      },
      {
        id: NOTED_ID,
        formName: 'Contact Form',
        note: 'my draft about X',
        status: 'pending',
        queuedAt: new Date().toISOString(),
        body: { draft: true },
      },
    ];
  });

  it('disables the Edit button for a SYNCING entry (and leaves PENDING rows enabled)', async () => {
    const wrapper = mountModal();
    await flushPromises();

    const editBtns = wrapper.findAll('[data-test="pending-edit"]');
    expect(editBtns).toHaveLength(3);
    // Entries are rendered in the order provided by the mock; index 1 is the SYNCING row.
    expect(editBtns[0].attributes('disabled')).toBeUndefined();
    expect(editBtns[1].attributes('disabled')).toBeDefined();
    expect(editBtns[2].attributes('disabled')).toBeUndefined();
  });

  it('shows the user note verbatim when present, and never renders the entry UUID', async () => {
    const wrapper = mountModal();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('my draft about X');
    // The load-bearing privacy invariant: no entry id ever surfaces as visible text.
    expect(text).not.toContain(PENDING_ID);
    expect(text).not.toContain(SYNCING_ID);
    expect(text).not.toContain(NOTED_ID);
  });

  it('renders the formName default row for a note-less PENDING entry', async () => {
    const wrapper = mountModal();
    await flushPromises();
    // Our i18n-t stub renders the formName slot ("Contact Form"). The visible
    // presence of that formName proves we're on the default-description branch,
    // not the UUID fallback.
    expect(wrapper.text()).toContain('Contact Form');
  });

  it('emits @edit with the entry when Edit is clicked (and does not touch remove())', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await wrapper.findAll('[data-test="pending-edit"]')[0].trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0][0].id).toBe(PENDING_ID);
    expect(queueMocks.remove).not.toHaveBeenCalled();
  });

  it('confirming Discard calls offlineQueue.remove with the entry id', async () => {
    const wrapper = mountModal();
    await flushPromises();

    // Click the trash icon on the first row to open the discard confirm dialog.
    const discardBtns = wrapper.findAll('[data-test="pending-discard-confirm"]');
    expect(discardBtns).toHaveLength(0); // not yet visible
    // Discard buttons on each row don't have a data-test; find by title.
    const rowTrashButtons = wrapper.findAll('button').filter((b) => b.attributes('title') === 'trans.offlineSubmission.pendingDiscardButton' && b.attributes('data-test') !== 'pending-discard-confirm');
    await rowTrashButtons[0].trigger('click');
    await flushPromises();

    // Now the confirm dialog is open; click confirm.
    await wrapper.find('[data-test="pending-discard-confirm"]').trigger('click');
    await flushPromises();

    expect(queueMocks.remove).toHaveBeenCalledTimes(1);
    expect(queueMocks.remove).toHaveBeenCalledWith(PENDING_ID);
  });
});
