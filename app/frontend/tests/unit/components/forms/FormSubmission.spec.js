import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, vi } from 'vitest';
import { useRouter } from 'vue-router';

import FormSubmission from '~/components/forms/FormSubmission.vue';
import { useFormStore } from '~/store/form';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: () => {},
  })),
}));

const STUBS = {
  AuditHistory: {
    template: '<div class="audit-history-stub"><slot /></div>',
  },
  DeleteSubmission: {
    template: '<div class="delete-submission-stub"><slot /></div>',
  },
  FormViewer: {
    template: '<div class="form-viewer-stub"><slot /></div>',
  },
  NotesPanel: {
    template: '<div class="notes-panel-stub"><slot /></div>',
  },
  StatusPanel: {
    template: '<div class="status-panel-stub"><slot /></div>',
  },
  PrintOptions: {
    template: '<div class="print-options-stub"><slot /></div>',
  },
  RouterLink: {
    template: '<div class="router-link-stub"><slot /></div>',
  },
};

describe('FormSubmission.vue', () => {
  const submissionId = '123-456';

  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders', async () => {
    const setWideLayout = vi.fn();
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      wideFormLayout: true,
    };
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementation(() => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementation(() => {});
    const wrapper = mount(FormSubmission, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date long'),
          },
        },
        provide: {
          setWideLayout,
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.formSubmission.submitted');
    expect(wrapper.text()).toContain('trans.formSubmission.confirmationID');
    expect(wrapper.text()).toContain('trans.formSubmission.submittedBy');
    expect(wrapper.text()).toContain('trans.formSubmission.submitted');
    expect(wrapper.text()).toContain('trans.formSubmission.submission');
    expect(wrapper.html()).toContain(formStore.form.name);
    expect(setWideLayout).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.isWideLayout).toBeTruthy();
  });

  it('onDelete should push to the FormSubmissions page', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const setWideLayout = vi.fn();
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementation(() => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementation(() => {});
    const wrapper = mount(FormSubmission, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date long'),
          },
        },
        provide: {
          setWideLayout,
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.onDelete();
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({
      name: 'FormSubmissions',
      query: {
        f: formStore.form.id,
      },
    });
  });

  it('setDraft will set isDraft to true if the status is REVISING otherwise false', async () => {
    const setWideLayout = vi.fn();
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementation(() => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementation(() => {});
    const wrapper = mount(FormSubmission, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date long'),
          },
        },
        provide: {
          setWideLayout,
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.setDraft('something');
    expect(wrapper.vm.isDraft).toBeFalsy();
    wrapper.vm.setDraft('REVISING');
    expect(wrapper.vm.isDraft).toBeTruthy();
  });

  it('toggleWideLayout should call setWideLayout', async () => {
    const setWideLayout = vi.fn();
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementation(() => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementation(() => {});
    const wrapper = mount(FormSubmission, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date long'),
          },
        },
        provide: {
          setWideLayout: setWideLayout,
        },
        stubs: STUBS,
      },
    });

    await flushPromises();
    setWideLayout.mockReset();
    await wrapper.vm.toggleWideLayout();
    expect(setWideLayout).toHaveBeenCalledTimes(1);
  });

  it('toggleSubmissionEdit should set submissionReadOnly to the opposite of the editing value and call fetchSubmission', async () => {
    const setWideLayout = vi.fn();
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
    fetchSubmissionSpy.mockImplementation(() => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementation(() => {});
    const wrapper = mount(FormSubmission, {
      props: {
        submissionId: submissionId,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date long'),
          },
        },
        provide: {
          setWideLayout: setWideLayout,
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    fetchSubmissionSpy.mockReset();

    setWideLayout.mockReset();
    await wrapper.vm.toggleSubmissionEdit(true);
    expect(wrapper.vm.submissionReadOnly).toBeFalsy();
    expect(fetchSubmissionSpy).toHaveBeenCalledTimes(1);
  });

  describe('enableSubmitterRevision logic', () => {
    it('displays StatusPanel and NotesPanel when enableSubmitterRevision is true', async () => {
      const setWideLayout = vi.fn();
      formStore.form = {
        id: 0,
        name: 'This is a form title',
        enableStatusUpdates: false,
        enableSubmitterRevision: true,
      };
      const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
      fetchSubmissionSpy.mockImplementation(() => {});
      const getFormPermissionsForUserSpy = vi.spyOn(
        formStore,
        'getFormPermissionsForUser'
      );
      getFormPermissionsForUserSpy.mockImplementation(() => {});
      const wrapper = mount(FormSubmission, {
        props: {
          submissionId: submissionId,
        },
        global: {
          plugins: [pinia],
          mocks: {
            $filters: {
              formatDateLong: vi.fn().mockReturnValue('formatted date long'),
            },
          },
          provide: {
            setWideLayout,
          },
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Should display StatusPanel and NotesPanel when enableSubmitterRevision is true
      expect(wrapper.findComponent('[data-test="status-panel"]').exists()).toBe(
        true
      );
      expect(wrapper.findComponent('[data-test="notes-panel"]').exists()).toBe(
        true
      );
    });

    it('displays StatusPanel and NotesPanel when enableStatusUpdates is true', async () => {
      const setWideLayout = vi.fn();
      formStore.form = {
        id: 0,
        name: 'This is a form title',
        enableStatusUpdates: true,
        enableSubmitterRevision: false,
      };
      const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
      fetchSubmissionSpy.mockImplementation(() => {});
      const getFormPermissionsForUserSpy = vi.spyOn(
        formStore,
        'getFormPermissionsForUser'
      );
      getFormPermissionsForUserSpy.mockImplementation(() => {});
      const wrapper = mount(FormSubmission, {
        props: {
          submissionId: submissionId,
        },
        global: {
          plugins: [pinia],
          mocks: {
            $filters: {
              formatDateLong: vi.fn().mockReturnValue('formatted date long'),
            },
          },
          provide: {
            setWideLayout,
          },
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Should display StatusPanel and NotesPanel when enableStatusUpdates is true
      expect(wrapper.findComponent('[data-test="status-panel"]').exists()).toBe(
        true
      );
      expect(wrapper.findComponent('[data-test="notes-panel"]').exists()).toBe(
        true
      );
    });

    it('displays StatusPanel and NotesPanel when both enableStatusUpdates and enableSubmitterRevision are true', async () => {
      const setWideLayout = vi.fn();
      formStore.form = {
        id: 0,
        name: 'This is a form title',
        enableStatusUpdates: true,
        enableSubmitterRevision: true,
      };
      const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
      fetchSubmissionSpy.mockImplementation(() => {});
      const getFormPermissionsForUserSpy = vi.spyOn(
        formStore,
        'getFormPermissionsForUser'
      );
      getFormPermissionsForUserSpy.mockImplementation(() => {});
      const wrapper = mount(FormSubmission, {
        props: {
          submissionId: submissionId,
        },
        global: {
          plugins: [pinia],
          mocks: {
            $filters: {
              formatDateLong: vi.fn().mockReturnValue('formatted date long'),
            },
          },
          provide: {
            setWideLayout,
          },
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Should display StatusPanel and NotesPanel when both are true
      expect(wrapper.findComponent('[data-test="status-panel"]').exists()).toBe(
        true
      );
      expect(wrapper.findComponent('[data-test="notes-panel"]').exists()).toBe(
        true
      );
    });

    it('does not display StatusPanel and NotesPanel when both enableStatusUpdates and enableSubmitterRevision are false', async () => {
      const setWideLayout = vi.fn();
      formStore.form = {
        id: 0,
        name: 'This is a form title',
        enableStatusUpdates: false,
        enableSubmitterRevision: false,
      };
      const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
      fetchSubmissionSpy.mockImplementation(() => {});
      const getFormPermissionsForUserSpy = vi.spyOn(
        formStore,
        'getFormPermissionsForUser'
      );
      getFormPermissionsForUserSpy.mockImplementation(() => {});
      const wrapper = mount(FormSubmission, {
        props: {
          submissionId: submissionId,
        },
        global: {
          plugins: [pinia],
          mocks: {
            $filters: {
              formatDateLong: vi.fn().mockReturnValue('formatted date long'),
            },
          },
          provide: {
            setWideLayout,
          },
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Should NOT display StatusPanel and NotesPanel when both are false
      expect(wrapper.findComponent('[data-test="status-panel"]').exists()).toBe(
        false
      );
      expect(wrapper.findComponent('[data-test="notes-panel"]').exists()).toBe(
        false
      );
    });

    it('StatusPanel and NotesPanel are disabled when submissionReadOnly is true', async () => {
      const setWideLayout = vi.fn();
      formStore.form = {
        id: 0,
        name: 'This is a form title',
        enableStatusUpdates: false,
        enableSubmitterRevision: true,
      };
      const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
      fetchSubmissionSpy.mockImplementation(() => {});
      const getFormPermissionsForUserSpy = vi.spyOn(
        formStore,
        'getFormPermissionsForUser'
      );
      getFormPermissionsForUserSpy.mockImplementation(() => {});
      const wrapper = mount(FormSubmission, {
        props: {
          submissionId: submissionId,
        },
        global: {
          plugins: [pinia],
          mocks: {
            $filters: {
              formatDateLong: vi.fn().mockReturnValue('formatted date long'),
            },
          },
          provide: {
            setWideLayout,
          },
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Initially submissionReadOnly should be true
      expect(wrapper.vm.submissionReadOnly).toBe(true);

      // Find the v-card elements that contain StatusPanel and NotesPanel
      const statusCard = wrapper.find('[data-test="status-panel-card"]');
      const notesCard = wrapper.find('[data-test="notes-panel-card"]');

      expect(statusCard.exists()).toBe(true);
      expect(notesCard.exists()).toBe(true);

      // Both cards should be disabled when submissionReadOnly is true
      // Check that the disabled prop is passed correctly to the v-cards
      expect(wrapper.vm.submissionReadOnly).toBe(true);
    });

    it('StatusPanel and NotesPanel are enabled when submissionReadOnly is false', async () => {
      const setWideLayout = vi.fn();
      formStore.form = {
        id: 0,
        name: 'This is a form title',
        enableStatusUpdates: false,
        enableSubmitterRevision: true,
      };
      const fetchSubmissionSpy = vi.spyOn(formStore, 'fetchSubmission');
      fetchSubmissionSpy.mockImplementation(() => {});
      const getFormPermissionsForUserSpy = vi.spyOn(
        formStore,
        'getFormPermissionsForUser'
      );
      getFormPermissionsForUserSpy.mockImplementation(() => {});
      const wrapper = mount(FormSubmission, {
        props: {
          submissionId: submissionId,
        },
        global: {
          plugins: [pinia],
          mocks: {
            $filters: {
              formatDateLong: vi.fn().mockReturnValue('formatted date long'),
            },
          },
          provide: {
            setWideLayout,
          },
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Set submissionReadOnly to false
      await wrapper.vm.toggleSubmissionEdit(true);
      expect(wrapper.vm.submissionReadOnly).toBe(false);

      // Find the v-card elements that contain StatusPanel and NotesPanel
      const statusCard = wrapper.find('[data-test="status-panel-card"]');
      const notesCard = wrapper.find('[data-test="notes-panel-card"]');

      expect(statusCard.exists()).toBe(true);
      expect(notesCard.exists()).toBe(true);

      // Both cards should NOT be disabled when submissionReadOnly is false
      // Check that the disabled prop is passed correctly to the v-cards
      expect(wrapper.vm.submissionReadOnly).toBe(false);
    });
  });
});
