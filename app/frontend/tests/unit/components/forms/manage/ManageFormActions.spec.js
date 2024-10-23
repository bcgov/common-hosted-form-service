import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';
import { useRouter } from 'vue-router';

import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';
import { ref } from 'vue';
import { useAppStore } from '~/store/app';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: () => {},
  })),
}));

const STUBS = {
  ShareForm: {
    template:
      '<div class="share-form-stub" lang="trans.shareForm.shareForm"><slot /></div>',
  },
  RouterLink: {
    template: '<div class="router-link-stub"><slot /></div>',
  },
};

describe('ManageForm.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders', async () => {
    formStore.permissions = [
      FormPermissions.FORM_DELETE,
      FormPermissions.EMAIL_TEMPLATE_UPDATE,
      FormPermissions.TEAM_UPDATE,
      FormPermissions.SUBMISSION_READ,
      FormPermissions.SUBMISSION_UPDATE,
    ];
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('trans.shareForm.shareForm');
    expect(wrapper.html()).toContain('trans.manageFormActions.viewSubmissions');
    expect(wrapper.html()).toContain('trans.manageFormActions.teamManagement');
    expect(wrapper.html()).toContain('trans.manageFormActions.emailManagement');
    expect(wrapper.html()).toContain('trans.manageFormActions.deleteForm');
  });

  it('canDeleteForm returns true if permissions include FORM_DELETE false otherwise', async () => {
    formStore.permissions = [FormPermissions.FORM_DELETE];
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.canDeleteForm).toBeTruthy();

    formStore.permissions = [];

    await flushPromises();

    expect(wrapper.vm.canDeleteForm).toBeFalsy();
  });

  it('canManageEmail returns true if permissions include EMAIL_TEMPLATE_UPDATE false otherwise', async () => {
    formStore.permissions = [FormPermissions.EMAIL_TEMPLATE_UPDATE];
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.canManageEmail).toBeTruthy();

    formStore.permissions = [];

    await flushPromises();

    expect(wrapper.vm.canManageEmail).toBeFalsy();
  });

  it('canManageTeam returns true if permissions include TEAM_UPDATE false otherwise', async () => {
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.canManageTeam).toBeTruthy();

    formStore.permissions = [];

    await flushPromises();

    expect(wrapper.vm.canManageTeam).toBeFalsy();
  });

  it('canViewSubmissions returns true if permissions include SUBMISSION_READ or SUBMISSION_UPDATE false otherwise', async () => {
    formStore.permissions = [FormPermissions.SUBMISSION_READ];
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.canViewSubmissions).toBeTruthy();

    formStore.permissions = [FormPermissions.SUBMISSION_UPDATE];

    await flushPromises();

    expect(wrapper.vm.canViewSubmissions).toBeTruthy();

    formStore.permissions = [
      FormPermissions.SUBMISSION_READ,
      FormPermissions.SUBMISSION_UPDATE,
    ];

    await flushPromises();

    expect(wrapper.vm.canViewSubmissions).toBeTruthy();

    formStore.permissions = [];

    await flushPromises();

    expect(wrapper.vm.canViewSubmissions).toBeFalsy();
  });

  it('isPublished returns true if there is a form version that is published', async () => {
    formStore.form = ref({
      versions: [
        {
          version: 1,
          published: false,
        },
        {
          version: 2,
          published: true,
        },
      ],
    });
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.isPublished).toBeTruthy();
  });

  it('isPublished returns false if there is no form version that is published', async () => {
    formStore.form = ref({});
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.isPublished).toBeFalsy();
  });

  it('deleteForm should hide the delete dialog, delete the current form, and push to a different page', async () => {
    const deleteCurrentFormSpy = vi.spyOn(formStore, 'deleteCurrentForm');
    deleteCurrentFormSpy.mockImplementationOnce(async () => {});
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const wrapper = mount(ManageFormActions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDate: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '123-456',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.deleteForm();

    await flushPromises();

    expect(wrapper.vm.showDeleteDialog).toBeFalsy();
    expect(deleteCurrentFormSpy).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledTimes(1);
  });
});
