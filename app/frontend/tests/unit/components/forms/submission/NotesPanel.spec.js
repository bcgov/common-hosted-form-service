import { createTestingPinia } from '@pinia/testing';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, vi } from 'vitest';

import NotesPanel from '~/components/forms/submission/NotesPanel.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { formService } from '~/services';
import { rbacService } from '~/services';
import { useAppStore } from '~/store/app';

const SUBMISSION_ID = 'submissionId';
const USER_ID = 'userId';

const STUBS = {
  VSkeletonLoader: {
    name: 'v-skeleton-loader',
    template: '<div class="v-skeleton-loader-stub"><slot /></div>',
  },
  VTooltip: {
    name: 'v-tooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
};

describe('NotesPanel', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const appStore = useAppStore(pinia);

  const addNotificationSpy = vi
    .spyOn(notificationStore, 'addNotification')
    .mockImplementation(() => {});

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    appStore.$reset();

    addNotificationSpy.mockReset();
  });

  it('renders', async () => {
    const getSubmissionNotesSpy = vi.spyOn(formService, 'getSubmissionNotes');
    getSubmissionNotesSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(NotesPanel, {
      props: {
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(getSubmissionNotesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
    expect(wrapper.html()).toContain('trans.notesPanel.notes');
    expect(wrapper.html()).toContain('trans.notesPanel.totalNotes');
    expect(wrapper.html()).toContain('trans.notesPanel.addNewNote');
  });

  it('addNote will call getCurrentUser and addNote then refresh or it will addNotification', async () => {
    const getSubmissionNotesSpy = vi.spyOn(formService, 'getSubmissionNotes');
    getSubmissionNotesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(NotesPanel, {
      props: {
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // onMounted calls this once
    getSubmissionNotesSpy.mockReset();
    addNotificationSpy.mockReset();

    getSubmissionNotesSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementation(() => {
      return {
        data: {
          id: USER_ID,
        },
      };
    });
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(async () => {
      return {
        data: {},
      };
    });

    wrapper.vm.newNote = 'This is a new note';
    await wrapper.vm.addNote();

    expect(getCurrentUserSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledWith(SUBMISSION_ID, {
      note: 'This is a new note',
      userId: USER_ID,
    });
    expect(getSubmissionNotesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('addNote will addNotification if response has no data', async () => {
    const getSubmissionNotesSpy = vi.spyOn(formService, 'getSubmissionNotes');
    getSubmissionNotesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(NotesPanel, {
      props: {
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // onMounted calls this once
    getSubmissionNotesSpy.mockReset();
    addNotificationSpy.mockReset();

    getSubmissionNotesSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementation(() => {
      return {
        data: {
          id: USER_ID,
        },
      };
    });
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(async () => {
      return {};
    });

    wrapper.vm.newNote = 'This is a new note';
    await wrapper.vm.addNote();

    expect(getCurrentUserSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledWith(SUBMISSION_ID, {
      note: 'This is a new note',
      userId: USER_ID,
    });
    expect(getSubmissionNotesSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('getNotes will call getSubmissionNotes and set the notes value', async () => {
    const getSubmissionNotesSpy = vi.spyOn(formService, 'getSubmissionNotes');
    getSubmissionNotesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(NotesPanel, {
      props: {
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // onMounted calls this once
    getSubmissionNotesSpy.mockReset();
    addNotificationSpy.mockReset();

    getSubmissionNotesSpy.mockImplementationOnce(() => {
      return {
        data: ['this is a note'],
      };
    });

    await wrapper.vm.getNotes();

    expect(getSubmissionNotesSpy).toBeCalledTimes(1);
    expect(wrapper.vm.notes).toEqual(['this is a note']);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('getNotes will addNotification if getSubmissionNotes throws an error', async () => {
    const getSubmissionNotesSpy = vi.spyOn(formService, 'getSubmissionNotes');
    getSubmissionNotesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(NotesPanel, {
      props: {
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // onMounted calls this once
    getSubmissionNotesSpy.mockReset();
    addNotificationSpy.mockReset();

    getSubmissionNotesSpy.mockImplementationOnce(() => {
      throw new Error();
    });

    await wrapper.vm.getNotes();

    expect(getSubmissionNotesSpy).toBeCalledTimes(1);
    expect(wrapper.vm.notes).toEqual([]);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
});
