import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { useFormStore } from '~/store/form';
import FormViewerActions from '~/components/designer/FormViewerActions.vue';
import { FormPermissions } from '~/utils/constants';

const STUBS = {
  RouterLink: {
    name: 'RouterLink',
    template: '<div class="router-link-stub"><slot /></div>',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VTooltip: {
    name: 'VTooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VIcon: {
    template: '<div class="v-icon-stub"><slot /></div>',
  },
  ManageSubmissionUsers: {
    template: '<div class="manage-submission-users-stub"><slot /></div>',
  },
};

describe('FormDisclaimer.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();

    formStore.isRTL = false;
  });

  it('renders', () => {
    const wrapper = mount(FormViewerActions, {
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.formViewerActions.wideLayout');
    expect(wrapper.text()).toContain('trans.printOptions.print');
  });

  it('showEditToggle returns true if readOnly is true and permissions includes SUBMISSION_UPDATE', async () => {
    const wrapper = shallowMount(FormViewerActions, {
      props: {
        readOnly: true,
        permissions: [FormPermissions.SUBMISSION_UPDATE],
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.showEditToggle).toBeTruthy();
  });

  it('when props.wideFormLayout is set from parent call setWideLayout', async () => {
    const setWideLayout = vi.fn();
    setWideLayout.mockImplementation(() => {});
    const wrapper = mount(FormViewerActions, {
      props: {
        wideFormLayout: true,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: setWideLayout,
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.isWideLayout).toBeTruthy();
    expect(setWideLayout).toBeCalledTimes(1);
  });

  it('toggleWideLayout will toggle isWideLayout and call setWideLayout', async () => {
    const setWideLayout = vi.fn();
    setWideLayout.mockImplementation(() => {});
    const wrapper = shallowMount(FormViewerActions, {
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: setWideLayout,
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    setWideLayout.mockReset();

    wrapper.vm.toggleWideLayout();
    expect(wrapper.vm.isWideLayout).toBeTruthy();
    expect(setWideLayout).toBeCalledTimes(1);
  });

  it('renders if submitters can upload submissions and it is single submission', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        allowSubmitterToUploadFile: true,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain(
      'trans.formViewerActions.switchMultiSubmssn'
    );
  });

  it('renders if submitters can upload submissions and it is single submission', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        allowSubmitterToUploadFile: true,
        bulkFile: true,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain(
      'trans.formViewerActions.switchSingleSubmssn'
    );
  });

  it('renders if canSaveDraft and draftEnabled is true and it is not bulkFile', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        canSaveDraft: true,
        draftEnabled: true,
        bulkFile: false,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.formViewerActions.saveAsADraft');
  });

  it('renders if showEditToggle, isDraft, and draftEnabled is true', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        readOnly: true,
        permissions: [FormPermissions.SUBMISSION_UPDATE],
        draftEnabled: true,
        isDraft: true,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.formViewerActions.editThisDraft');
  });

  it('renders if submissionId exists and draftEnabled is true', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        submissionId: '123',
        draftEnabled: true,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).toContain('manage-submission-users-stub');
  });

  it('does not render drafts, switch submissions functionality and reders widelayout, print', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        publicForm: true,
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.formViewerActions.wideLayout');
    expect(wrapper.text()).toContain('trans.printOptions.print');

    expect(wrapper.text()).not.toContain(
      'trans.formViewerActions.viewMyDraftOrSubmissions'
    );
    expect(wrapper.text()).not.toContain(
      'trans.formViewerActions.switchSingleSubmssn'
    );
    expect(wrapper.text()).not.toContain(
      'trans.formViewerActions.saveAsADraft'
    );
    expect(wrapper.text()).not.toContain(
      'trans.formViewerActions.editThisDraft'
    );
    expect(wrapper.text()).not.toContain(
      'trans.manageSubmissionUsers.manageTeamMembers'
    );
  });

  it('show viewMyDraftOrSubmissions when set formId && not publicForm ', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        publicForm: false,
        formId: '123-456',
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain(
      'trans.formViewerActions.viewMyDraftOrSubmissions'
    );
  });

  it('hide viewMyDraftOrSubmissions when set formId && publicForm ', () => {
    const wrapper = mount(FormViewerActions, {
      props: {
        publicForm: true,
        formId: '123-456',
      },
      global: {
        plugins: [pinia],
        provide: {
          setWideLayout: vi.fn(),
        },
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).not.toContain(
      'trans.formViewerActions.viewMyDraftOrSubmissions'
    );
  });
});
