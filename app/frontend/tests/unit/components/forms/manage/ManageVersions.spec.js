// @vitest-environment happy-dom
// happy-dom is required to access window.URL

import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import * as formComposables from '~/composables/form';
import ManageVersions from '~/components/forms/manage/ManageVersions.vue';
import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: () => {},
  })),
}));

const STUBS = {
  RouterLink: {
    template: '<div class="router-link-stub"><slot /></div>',
  },
};

describe('ManageVersions.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    appStore.$reset();
  });

  it('renders', async () => {
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
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

    expect(wrapper.text()).toContain('trans.manageVersions.important');
    expect(wrapper.text()).toContain('trans.manageVersions.infoA');
    expect(wrapper.text()).toContain('trans.manageVersions.infoB');
    expect(wrapper.text()).toContain('trans.manageVersions.version');
    expect(wrapper.text()).toContain('trans.manageVersions.status');
    expect(wrapper.text()).toContain('trans.manageVersions.dateCreated');
    expect(wrapper.text()).toContain('trans.manageVersions.createdBy');
    expect(wrapper.text()).toContain('trans.manageVersions.actions');
  });

  it('versionList will reformat the draft object and join with versions array', async () => {
    const VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
    };
    const DRAFT_ONE = {
      id: '2',
      isDraft: true,
      published: false,
      version: 5,
    };
    formStore.form = ref({
      versions: [VERSION_ONE],
    });
    formStore.drafts = ref([DRAFT_ONE]);
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
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

    let versionList = wrapper.vm.versionList;

    expect(
      versionList.find(
        (version) =>
          version.id === '1' &&
          version.published === true &&
          version.version === 1
      )
    ).toEqual(VERSION_ONE);

    expect(
      versionList.find(
        (version) =>
          version.id === '2' &&
          version.isDraft === true &&
          version.published === false &&
          version.version === 2
      )
    ).toEqual({
      id: '2',
      isDraft: true,
      published: false,
      version: 2,
    });

    // If there are no drafts then it should just return the versions
    formStore.drafts = [];
    versionList = wrapper.vm.versionList;
    expect(versionList).toEqual([VERSION_ONE]);

    // If there are no drafts then it should just return the versions and no form then it returns an empty array
    formStore.form = null;
    formStore.drafts = [];
    versionList = wrapper.vm.versionList;
    expect(versionList).toEqual([]);
  });

  it('onMounted toggles publish if we have access to the form designer', async () => {
    const VERSION_ONE = {
      version: 1,
      published: false,
      id: '1',
    };
    formStore.form = ref({
      versions: [VERSION_ONE],
    });
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: true,
          draftId: '1',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();
    expect(wrapper.vm.showPublishDialog).toBeTruthy();
  });

  it('deleteCurrentDraft should hide the delete dialog and call delete draft and then fetchDrafts', async () => {
    const VERSION_ONE = {
      version: 1,
      published: false,
      id: '1',
    };
    formStore.form = ref({
      id: '1',
      versions: [VERSION_ONE],
    });
    formStore.drafts = ref([{ id: '1' }]);
    const deleteDraftSpy = vi.spyOn(formStore, 'deleteDraft');
    deleteDraftSpy.mockImplementationOnce(async () => {});
    const fetchDraftsSpy = vi.spyOn(formStore, 'fetchDrafts');
    fetchDraftsSpy.mockImplementationOnce(async () => {});
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
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

    await wrapper.vm.deleteCurrentDraft();

    expect(wrapper.vm.showDeleteDraftDialog).toBeFalsy();
    expect(deleteDraftSpy).toHaveBeenCalledTimes(1);
    expect(fetchDraftsSpy).toHaveBeenCalledTimes(1);
  });

  it('createVersion will show the drafts dialog if there is a draft', async () => {
    const VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
    };
    const DRAFT_ONE = {
      id: '2',
      isDraft: true,
      published: false,
      version: 5,
    };
    formStore.form = ref({
      versions: [VERSION_ONE],
    });
    formStore.drafts = ref([DRAFT_ONE]);
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
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

    expect(wrapper.vm.showHasDraftsDialog).toBeFalsy();

    wrapper.vm.createVersion('1', '1');

    expect(wrapper.vm.showHasDraftsDialog).toBeTruthy();
  });

  it('createVersion will push to the form designer if it does not have a draft', async () => {
    const push = vi.fn();
    useRouter.mockImplementationOnce(() => ({
      push,
    }));
    const VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
    };
    formStore.form = ref({
      versions: [VERSION_ONE],
    });
    formStore.drafts = null;
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '1',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.createVersion('1', '1');

    await flushPromises();

    expect(push).toHaveBeenCalledTimes(1);
  });

  it('cancel publish should stop showing the publish dialog and rerender the table and toggle the published value for a draft', async () => {
    let VERSION_ONE = {
      version: 1,
      published: false,
      id: '1',
    };
    let DRAFT_ONE = {
      id: '2',
      isDraft: true,
      published: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '1',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    // mock that we're publishing
    wrapper.vm.publishOpts = {
      id: '2',
    };
    wrapper.vm.showPublishDialog = true;

    await nextTick();

    // versionList sets the publishing to false by default so we need to set it again after it finishes rendering
    formStore.form = {
      versions: [VERSION_ONE],
    };
    formStore.drafts = [DRAFT_ONE];

    expect(wrapper.vm.showPublishDialog).toBeTruthy();
    expect(formStore.drafts).toEqual([DRAFT_ONE]);
    expect(wrapper.vm.rerenderTable).toEqual(0);

    wrapper.vm.cancelPublish();

    expect(wrapper.vm.showPublishDialog).toBeFalsy();
    expect(formStore.drafts).toEqual([
      {
        id: '2',
        isDraft: true,
        published: false,
        version: 2,
      },
    ]);
    expect(wrapper.vm.rerenderTable).toEqual(1);
  });

  it('cancel publish should stop showing the publish dialog and rerender the table and toggle the published value for a existing form version', async () => {
    let VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
    };
    formStore.form = {
      versions: [VERSION_ONE],
    };
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
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

    // mock that we're publishing
    wrapper.vm.publishOpts = {
      id: '1',
    };
    wrapper.vm.showPublishDialog = true;

    await nextTick();

    expect(wrapper.vm.showPublishDialog).toBeTruthy();
    expect(formStore.form.versions).toEqual([VERSION_ONE]);
    expect(wrapper.vm.rerenderTable).toEqual(0);

    wrapper.vm.cancelPublish();

    await flushPromises();

    expect(wrapper.vm.showPublishDialog).toBeFalsy();
    expect(formStore.form.versions).toEqual([
      {
        version: 1,
        published: false,
        id: '1',
      },
    ]);
    expect(wrapper.vm.rerenderTable).toEqual(1);
  });

  it('togglePublish should set the publishOpts and show the publish dialog', async () => {
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
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

    expect(wrapper.vm.publishOpts).toEqual({
      publishing: true,
      version: '',
      id: '',
    });
    wrapper.vm.togglePublish(true, '1', 1, false);

    expect(wrapper.vm.publishOpts).toEqual({
      publishing: true,
      version: 1,
      id: '1',
      isDraft: false,
    });
    expect(wrapper.vm.showPublishDialog).toBeTruthy();
  });

  it('turnOnPublish should set the published value for a draft to true and show the showPublishDialog', async () => {
    let VERSION_ONE = {
      version: 1,
      published: false,
      id: '1',
      isDraft: false,
    };
    let DRAFT_ONE = {
      version: 2,
      published: true,
      id: '2',
      isDraft: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '2',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    formStore.form = {
      versions: [VERSION_ONE],
    };
    formStore.drafts = [DRAFT_ONE];
    wrapper.vm.turnOnPublish();

    expect(wrapper.vm.publishOpts).toEqual({
      publishing: true,
      version: 2,
      id: '2',
      isDraft: true,
    });
  });

  it('onExportClick should create element', async () => {
    const exportFormSchemaSpy = vi.spyOn(formComposables, 'exportFormSchema');
    exportFormSchemaSpy.mockImplementationOnce(() => {});
    let VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
      isDraft: false,
    };
    let DRAFT_ONE = {
      version: 2,
      published: true,
      id: '2',
      isDraft: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
      name: 'this is a form title',
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '2',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.onExportClick('1', false);
    expect(exportFormSchemaSpy).toHaveBeenCalledTimes(1);
  });

  it('getFormSchema should set the form schema for a version', async () => {
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const readVersionSpy = vi.spyOn(formService, 'readVersion');
    readVersionSpy.mockImplementationOnce(() => {
      return {
        data: {
          schema: {
            id: '1',
            projectId: '123',
          },
        },
      };
    });
    const readDraftSpy = vi.spyOn(formService, 'readDraft');
    readDraftSpy.mockImplementationOnce(() => {
      return {
        data: {
          schema: {
            id: '1',
            projectId: '123',
          },
        },
      };
    });
    let VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
      isDraft: false,
    };
    let DRAFT_ONE = {
      version: 2,
      published: true,
      id: '2',
      isDraft: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
      name: 'this is a form title',
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '2',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.getFormSchema('1', false);

    expect(readVersionSpy).toHaveBeenCalledTimes(1);
    expect(readDraftSpy).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
  });

  it('getFormSchema should set the form schema for a draft', async () => {
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const readVersionSpy = vi.spyOn(formService, 'readVersion');
    readVersionSpy.mockImplementationOnce(() => {
      return {
        data: {
          schema: {
            id: '1',
            projectId: '123',
          },
        },
      };
    });
    const readDraftSpy = vi.spyOn(formService, 'readDraft');
    readDraftSpy.mockImplementationOnce(() => {
      return {
        data: {
          schema: {
            id: '1',
            projectId: '123',
          },
        },
      };
    });
    let VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
      isDraft: false,
    };
    let DRAFT_ONE = {
      version: 2,
      published: true,
      id: '2',
      isDraft: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
      name: 'this is a form title',
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '2',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.getFormSchema('1', true);

    expect(readVersionSpy).toHaveBeenCalledTimes(0);
    expect(readDraftSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
  });

  it('updatePublish will publish a draft and then fetchDrafts if it is a draft', async () => {
    const publishDraftSpy = vi.spyOn(formStore, 'publishDraft');
    publishDraftSpy.mockImplementationOnce(() => {});
    const toggleVersionPublishSpy = vi.spyOn(formStore, 'toggleVersionPublish');
    toggleVersionPublishSpy.mockImplementationOnce(() => {});
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockImplementationOnce(() => {});
    let VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
      isDraft: false,
    };
    let DRAFT_ONE = {
      version: 2,
      published: true,
      id: '2',
      isDraft: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
      name: 'this is a form title',
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '2',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.publishOpts = {
      isDraft: true,
      id: '2',
    };

    await wrapper.vm.updatePublish();
    expect(publishDraftSpy).toHaveBeenCalledTimes(1);
    expect(toggleVersionPublishSpy).toHaveBeenCalledTimes(0);
    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
  });

  it('updatePublish will publish an existing form version and then fetchDrafts if it is not a draft', async () => {
    const publishDraftSpy = vi.spyOn(formStore, 'publishDraft');
    publishDraftSpy.mockImplementationOnce(() => {});
    const toggleVersionPublishSpy = vi.spyOn(formStore, 'toggleVersionPublish');
    toggleVersionPublishSpy.mockImplementationOnce(() => {});
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockImplementationOnce(() => {});
    let VERSION_ONE = {
      version: 1,
      published: true,
      id: '1',
      isDraft: false,
    };
    let DRAFT_ONE = {
      version: 2,
      published: true,
      id: '2',
      isDraft: true,
    };
    formStore.form = {
      versions: [VERSION_ONE],
      name: 'this is a form title',
    };
    formStore.drafts = [DRAFT_ONE];
    const wrapper = mount(ManageVersions, {
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        provide: {
          formDesigner: false,
          draftId: '2',
          formId: '123-456',
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.publishOpts = {
      isDraft: false,
      id: '1',
    };

    await wrapper.vm.updatePublish();
    expect(publishDraftSpy).toHaveBeenCalledTimes(0);
    expect(toggleVersionPublishSpy).toHaveBeenCalledTimes(1);
    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
  });
});
