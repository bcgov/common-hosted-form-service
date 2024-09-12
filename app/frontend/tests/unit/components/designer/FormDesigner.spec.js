// @vitest-environment happy-dom
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';
import { useRouter } from 'vue-router';

import FormDesigner from '~/components/designer/FormDesigner.vue';
import * as formComposables from '~/composables/form';
import formioIl8next from '~/internationalization/trans/formio/formio.json';
import templateExtensions from '~/plugins/templateExtensions';
import { formService, userService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormDesignerBuilderOptions, IdentityMode } from '~/utils/constants';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: () => {},
    replace: () => {},
  })),
}));

const STUBS = {
  RouterLink: {
    name: 'RouterLink',
    template: '<div class="router-link-stub"><slot /></div>',
  },
};

describe('FormDesigner.vue', () => {
  useRouter.mockReturnValue({
    currentRoute: {
      query: '',
    },
  });
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const getProxyHeadersSpy = vi.spyOn(formService, 'getProxyHeaders');
  const readVersionSpy = vi.spyOn(formService, 'readVersion');
  const readDraftSpy = vi.spyOn(formService, 'readDraft');
  const setDirtyFlagSpy = vi.spyOn(formStore, 'setDirtyFlag');

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
    notificationStore.$reset();

    authStore.keycloak = {
      tokenParsed: {
        email: 'email@email.com',
        name: 'lucy',
      },
      userName: 'userName',
      token: 'token',
      fullName: 'fullName',
    };

    fetchFormSpy.mockReset();
    fetchFormSpy.mockImplementationOnce(() => {
      formStore.form = {
        id: '00329319-f1da-45c7-a956-9c765dcf36d1',
        name: 'Test Form',
        description: '',
        active: true,
        labels: ['test-label'],
        createdBy: 'TEST@idir',
        createdAt: '2024-09-09T21:18:52.706Z',
        updatedBy: null,
        updatedAt: '2024-09-09T21:18:52.697Z',
        showSubmissionConfirmation: true,
        submissionReceivedEmails: [],
        enableStatusUpdates: true,
        enableSubmitterDraft: true,
        schedule: {
          enabled: null,
          scheduleType: null,
          openSubmissionDateTime: null,
          keepOpenForTerm: null,
          keepOpenForInterval: null,
          closingMessageEnabled: null,
          closingMessage: null,
          closeSubmissionDateTime: null,
          repeatSubmission: {
            enabled: null,
            repeatUntil: null,
            everyTerm: null,
            everyIntervalType: null,
          },
          allowLateSubmissions: {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          },
        },
        reminder_enabled: false,
        enableCopyExistingSubmission: true,
        allowSubmitterToUploadFile: false,
        subscribe: {
          enabled: null,
        },
        deploymentLevel: 'development',
        ministry: 'AF',
        apiIntegration: true,
        useCase: 'application',
        sendSubmissionReceivedEmail: false,
        wideFormLayout: true,
        enableDocumentTemplates: false,
        versions: [],
        identityProviders: [],
        snake: 'test_form',
        idps: [],
        userType: 'team',
      };
    });

    addNotificationSpy.mockReset();
    addNotificationSpy.mockImplementation(() => {});

    getProxyHeadersSpy.mockReset();
    getProxyHeadersSpy.mockImplementationOnce(() => {
      return {
        data: {
          'X-CHEFS-PROXY-DATA': '',
        },
      };
    });

    readVersionSpy.mockReset();
    readVersionSpy.mockImplementation(() => {
      return {
        data: {
          schema: {},
        },
      };
    });
    readDraftSpy.mockReset();
    readDraftSpy.mockImplementation(() => {
      return {
        data: {
          schema: {},
        },
      };
    });

    setDirtyFlagSpy.mockReset();
    setDirtyFlagSpy.mockImplementation(() => {});

    formStore.form.isDirty = false;
  });

  it('when the form is changed, it will increment reRenderFormIo', async () => {
    const wrapper = shallowMount(FormDesigner, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    formStore.form = {};

    await flushPromises();

    expect(wrapper.vm.reRenderFormIo).toEqual(1);
  });

  describe('onMounted', () => {
    it('onMounted, if there is a form id it will fetchForm and getFormSchema, if no versionId or draftId is set, it will throw an error', async () => {
      shallowMount(FormDesigner, {
        props: {
          formId: '123',
        },
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(fetchFormSpy).toBeCalledTimes(1);
      expect(getProxyHeadersSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(1);
      expect(readVersionSpy).toBeCalledTimes(0);
    });

    it('onMounted, if there is a form id it will fetchForm and getFormSchema, if there is a version id will call readVersion', async () => {
      readVersionSpy.mockImplementationOnce(() => {
        return {
          data: {
            schema: {},
          },
        };
      });

      shallowMount(FormDesigner, {
        props: {
          formId: '123',
          versionId: '123',
        },
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();
      expect(fetchFormSpy).toBeCalledTimes(1);
      expect(getProxyHeadersSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
      expect(readVersionSpy).toBeCalledTimes(1);
      expect(readDraftSpy).toBeCalledTimes(0);
    });

    it('onMounted, if there is a form id it will fetchForm and getFormSchema, if there is a draft id will call readDraft', async () => {
      shallowMount(FormDesigner, {
        props: {
          formId: '123',
          draftId: '123',
        },
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();
      expect(fetchFormSpy).toBeCalledTimes(1);
      expect(getProxyHeadersSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
      expect(readVersionSpy).toBeCalledTimes(0);
      expect(readDraftSpy).toBeCalledTimes(1);
    });
  });

  it('setProxyHeaders will addNotification if an error occurs', async () => {
    const wrapper = shallowMount(FormDesigner, {
      props: {
        formId: '123',
        draftId: '123',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    getProxyHeadersSpy.mockReset();
    getProxyHeadersSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    await wrapper.vm.setProxyHeaders();
    expect(getProxyHeadersSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('onMounted, patch originalSchema should be a clone of the formSchema', async () => {
    const wrapper = shallowMount(FormDesigner, {
      props: {
        formId: '123',
        draftId: '123',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.patch.originalSchema).toEqual(null);

    await flushPromises();

    expect(wrapper.vm.patch.originalSchema).toEqual({
      components: [],
      display: 'form',
      type: 'form',
    });
  });

  it('designerOptions returns certain values depending on userType or locale', async () => {
    const wrapper = shallowMount(FormDesigner, {
      props: {
        formId: '123',
        draftId: '123',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.designerOptions).toEqual({
      sanitizeConfig: {
        addTags: ['iframe'],
        ALLOWED_TAGS: ['iframe'],
      },
      noDefaultSubmitButton: false,
      builder: {
        ...FormDesignerBuilderOptions,
        customControls: {
          ...FormDesignerBuilderOptions.customControls,
          components: {
            ...FormDesignerBuilderOptions.customControls.components,
            simplefile: formStore.form.userType !== IdentityMode.PUBLIC,
          },
        },
      },
      language: 'en',
      i18n: formioIl8next,
      templates: templateExtensions,
      evalContext: {
        token: authStore.tokenParsed,
        user: authStore.user,
      },
    });
  });

  it('DISPLAY_VERSION returns the design version for a form + 1 or 1 if it is a new form', async () => {
    const wrapper = shallowMount(FormDesigner, {
      props: {
        formId: '123',
        draftId: '123',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    formStore.form.versions = [{}, {}];
    await flushPromises();

    expect(wrapper.vm.DISPLAY_VERSION).toEqual(3);
  });

  describe('submitFormSchema will setDirtyFlag', () => {
    it('and call schemaCreateNew if there is no formId', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({
        push,
      }));
      const updateUserLabelsSpy = vi.spyOn(userService, 'updateUserLabels');
      updateUserLabelsSpy.mockImplementation(() => {
        return {
          data: [],
        };
      });
      const createFormSpy = vi.spyOn(formService, 'createForm');
      const createDraftSpy = vi.spyOn(formService, 'createDraft');
      const updateDraftSpy = vi.spyOn(formService, 'updateDraft');
      createFormSpy.mockImplementation(() => {
        return {
          data: {
            id: '123',
            draft: {
              id: '123',
            },
          },
        };
      });
      formStore.userLabels = ['test-label-update'];
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.submitFormSchema();

      expect(setDirtyFlagSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
      expect(createFormSpy).toBeCalledTimes(1);
      expect(createDraftSpy).toBeCalledTimes(0);
      expect(updateDraftSpy).toBeCalledTimes(0);
      expect(push).toBeCalledTimes(1);
      expect(updateUserLabelsSpy).toBeCalledTimes(1);
    });
    it('and call schemaCreateDraftFromVersion if there is a formId and version id', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({
        push,
      }));
      const createFormSpy = vi.spyOn(formService, 'createForm');
      const createDraftSpy = vi.spyOn(formService, 'createDraft');
      const updateDraftSpy = vi.spyOn(formService, 'updateDraft');
      createDraftSpy.mockImplementation(() => {
        return {
          data: {
            id: '123',
          },
        };
      });
      const wrapper = shallowMount(FormDesigner, {
        props: {
          formId: '123',
          versionId: '123',
        },
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.submitFormSchema();

      expect(setDirtyFlagSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
      expect(createFormSpy).toBeCalledTimes(0);
      expect(createDraftSpy).toBeCalledTimes(1);
      expect(updateDraftSpy).toBeCalledTimes(0);
      expect(push).toBeCalledTimes(1);
    });
    it('and call schemaUpdateExistingDraft if there is a formId and draft id', async () => {
      const replace = vi.fn();
      useRouter.mockImplementation(() => ({
        replace,
        currentRoute: { value: { query: '' } },
      }));
      const createFormSpy = vi.spyOn(formService, 'createForm');
      const createDraftSpy = vi.spyOn(formService, 'createDraft');
      const updateDraftSpy = vi.spyOn(formService, 'updateDraft');
      updateDraftSpy.mockImplementation(() => {});
      const wrapper = shallowMount(FormDesigner, {
        props: {
          formId: '123',
          draftId: '123',
        },
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.submitFormSchema();

      expect(setDirtyFlagSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledTimes(0);
      expect(createFormSpy).toBeCalledTimes(0);
      expect(createDraftSpy).toBeCalledTimes(0);
      expect(updateDraftSpy).toBeCalledTimes(1);
      expect(replace).toBeCalledTimes(1);
    });
    test('if an error is caught, it will setDirtyFlag again and addNotification', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({
        push,
      }));
      const createFormSpy = vi.spyOn(formService, 'createForm');
      const createDraftSpy = vi.spyOn(formService, 'createDraft');
      const updateDraftSpy = vi.spyOn(formService, 'updateDraft');
      createFormSpy.mockImplementation(() => {
        throw new Error();
      });
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.submitFormSchema();

      expect(setDirtyFlagSpy).toBeCalledTimes(2);
      expect(addNotificationSpy).toBeCalledTimes(1);
      expect(createFormSpy).toBeCalledTimes(1);
      expect(createDraftSpy).toBeCalledTimes(0);
      expect(updateDraftSpy).toBeCalledTimes(0);
      expect(push).toBeCalledTimes(0);
    });
  });

  describe('patch history', () => {
    it('canUndoPatch will return true if there is patch history, if the current action is not at the beginning and the current index is less than the number of actions in the history', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(wrapper.vm.canUndoPatch()).toBeFalsy();
      expect(wrapper.vm.undoEnabled()).toBeFalsy();
      wrapper.vm.patch.history = [{ id: '123' }, { id: '124' }];
      expect(wrapper.vm.canUndoPatch()).toBeFalsy();
      expect(wrapper.vm.undoEnabled()).toBeFalsy();
      wrapper.vm.patch.index = 1;
      expect(wrapper.vm.canUndoPatch()).toBeTruthy();
      expect(wrapper.vm.undoEnabled()).toBeTruthy();
    });
    it('canRedoPatch will return true if there is patch history, if the current action is not at the end of the action history', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(wrapper.vm.canRedoPatch()).toBeFalsy();
      expect(wrapper.vm.redoEnabled()).toBeFalsy();
      wrapper.vm.patch.history = [{ id: '123' }, { id: '124' }];
      wrapper.vm.patch.index = 1;
      expect(wrapper.vm.canRedoPatch()).toBeFalsy();
      expect(wrapper.vm.redoEnabled()).toBeFalsy();
      wrapper.vm.patch.index = 0;
      expect(wrapper.vm.canRedoPatch()).toBeTruthy();
      expect(wrapper.vm.redoEnabled()).toBeTruthy();
    });
    it('resetHistoryFlags should set componentAddedStart, componentMovedStart, componentRemovedStart to whatever flag is passed, false default', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.resetHistoryFlags();
      expect(wrapper.vm.patch.componentAddedStart).toBeFalsy();
      expect(wrapper.vm.patch.componentMovedStart).toBeFalsy();
      expect(wrapper.vm.patch.componentRemovedStart).toBeFalsy();
      wrapper.vm.resetHistoryFlags(true);
      expect(wrapper.vm.patch.componentAddedStart).toBeTruthy();
      expect(wrapper.vm.patch.componentMovedStart).toBeTruthy();
      expect(wrapper.vm.patch.componentRemovedStart).toBeTruthy();
    });
    it('getPatch will return the form at a specific point in history, not just the changes', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.patch.index = 1;
      wrapper.vm.originalSchema = {
        components: [],
        display: 'form',
        type: 'form',
      };
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'replace', path: '/components/0/id', value: '124' }],
        [{ op: 'remove', path: '/components/0/id' }],
      ];
      expect(wrapper.vm.getPatch(0)).toEqual({
        components: [
          {
            id: '123',
          },
        ],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.getPatch(1)).toEqual({
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.getPatch(2)).toEqual({
        components: [{}],
        display: 'form',
        type: 'form',
      });
    });
    it('undoPatchFromHistory will revert a change', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.patch.index = 1;
      wrapper.vm.originalSchema = {
        components: [],
        display: 'form',
        type: 'form',
      };
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'replace', path: '/components/0/id', value: '124' }],
        [{ op: 'remove', path: '/components/0/id' }],
      ];
      // formSchema is the current form that the FormBuilder is modifying, this is at index 1
      wrapper.vm.formSchema = {
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      };
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      });
      wrapper.vm.undoPatchFromHistory();
      expect(wrapper.vm.savedStatus).toEqual('Save');
      expect(wrapper.vm.isFormSaved).toEqual(false);
      expect(wrapper.vm.canSave).toEqual(true);
      expect(wrapper.vm.patch.undoClicked).toEqual(true);
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '123',
          },
        ],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.reRenderFormIo).toEqual(1);
      wrapper.vm.patch.index = 1;
      wrapper.vm.originalSchema = {
        components: [],
        display: 'form',
        type: 'form',
      };
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'replace', path: '/components/0/id', value: '124' }],
        [{ op: 'remove', path: '/components/0/id' }],
      ];
      // formSchema is the current form that the FormBuilder is modifying, this is at index 1
      wrapper.vm.formSchema = {
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      };
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      });
      wrapper.vm.onUndoClick();
      expect(wrapper.vm.savedStatus).toEqual('Save');
      expect(wrapper.vm.isFormSaved).toEqual(false);
      expect(wrapper.vm.canSave).toEqual(true);
      expect(wrapper.vm.patch.undoClicked).toEqual(true);
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '123',
          },
        ],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.reRenderFormIo).toEqual(2);
    });
    it('undoPatchFromHistory will revert a change', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.patch.index = 1;
      wrapper.vm.originalSchema = {
        components: [],
        display: 'form',
        type: 'form',
      };
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'replace', path: '/components/0/id', value: '124' }],
        [{ op: 'remove', path: '/components/0/id' }],
      ];
      // formSchema is the current form that the FormBuilder is modifying, this is at index 1
      wrapper.vm.formSchema = {
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      };
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      });
      wrapper.vm.undoPatchFromHistory();
      expect(wrapper.vm.savedStatus).toEqual('Save');
      expect(wrapper.vm.isFormSaved).toEqual(false);
      expect(wrapper.vm.canSave).toEqual(true);
      expect(wrapper.vm.patch.undoClicked).toEqual(true);
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '123',
          },
        ],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.reRenderFormIo).toEqual(1);
    });
    it('redoPatchFromHistory will move forward in history', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.patch.index = 1;
      wrapper.vm.originalSchema = {
        components: [],
        display: 'form',
        type: 'form',
      };
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'replace', path: '/components/0/id', value: '124' }],
        [{ op: 'remove', path: '/components/0/id' }],
      ];
      // formSchema is the current form that the FormBuilder is modifying, this is at index 1
      wrapper.vm.formSchema = {
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      };
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      });
      wrapper.vm.redoPatchFromHistory();
      expect(wrapper.vm.savedStatus).toEqual('Save');
      expect(wrapper.vm.isFormSaved).toEqual(false);
      expect(wrapper.vm.canSave).toEqual(true);
      expect(wrapper.vm.patch.redoClicked).toEqual(true);
      expect(wrapper.vm.formSchema).toEqual({
        components: [{}],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.reRenderFormIo).toEqual(1);

      wrapper.vm.patch.index = 1;
      wrapper.vm.originalSchema = {
        components: [],
        display: 'form',
        type: 'form',
      };
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'replace', path: '/components/0/id', value: '124' }],
        [{ op: 'remove', path: '/components/0/id' }],
      ];
      // formSchema is the current form that the FormBuilder is modifying, this is at index 1
      wrapper.vm.formSchema = {
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      };
      expect(wrapper.vm.formSchema).toEqual({
        components: [
          {
            id: '124',
          },
        ],
        display: 'form',
        type: 'form',
      });
      wrapper.vm.onRedoClick();
      expect(wrapper.vm.savedStatus).toEqual('Save');
      expect(wrapper.vm.isFormSaved).toEqual(false);
      expect(wrapper.vm.canSave).toEqual(true);
      expect(wrapper.vm.patch.redoClicked).toEqual(true);
      expect(wrapper.vm.formSchema).toEqual({
        components: [{}],
        display: 'form',
        type: 'form',
      });
      expect(wrapper.vm.reRenderFormIo).toEqual(2);
    });
    it('addPatchToHistory will add the changes to the history', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.patch.index = 0;
      wrapper.vm.patch.history = [
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
      ];
      expect(wrapper.vm.patch.history).toEqual([
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
      ]);
      wrapper.vm.addPatchToHistory();
      expect(wrapper.vm.patch.history).toEqual([
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
        [{ op: 'remove', path: '/components/0' }],
      ]);
      wrapper.vm.formSchema = {
        components: [{ id: '123' }],
        display: 'form',
        type: 'form',
      };
      // Removes the head of the patch history
      wrapper.vm.patch.MAX_PATCHES = 1;
      // Adding patch to history here should clear out actions in the history
      // greater than the index, since we're at index -1
      wrapper.vm.addPatchToHistory();
      expect(wrapper.vm.patch.history).toEqual([
        [{ op: 'remove', path: '/components/0' }],
        [{ op: 'add', path: '/components/0', value: { id: '123' } }],
      ]);
      expect(wrapper.vm.patch.originalSchema).toEqual({
        components: [{ id: '123' }],
        display: 'form',
        type: 'form',
      });
    });
    describe('onSchemaChange', () => {
      it('undo was clicked or redo was clicked', async () => {
        const wrapper = shallowMount(FormDesigner, {
          props: {},
          global: {
            plugins: [pinia],
            stubs: STUBS,
          },
        });
        await flushPromises();
        wrapper.vm.patch.undoClicked = true;
        wrapper.vm.patch.redoClicked = true;
        wrapper.vm.onSchemaChange(
          [
            {
              components: [{ id: '123' }],
              display: 'form',
              type: 'form',
            },
          ],
          undefined,
          undefined
        );
        expect(wrapper.vm.patch.undoClicked).toBeFalsy();
        expect(wrapper.vm.patch.redoClicked).toBeFalsy();
        expect(wrapper.vm.patch.componentAddedStart).toBeFalsy();
        expect(wrapper.vm.patch.componentMovedStart).toBeFalsy();
        expect(wrapper.vm.patch.componentRemovedStart).toBeFalsy();
      });
      describe('undo/redo was not clicked', () => {
        describe('flags/modified are undefined', () => {
          it('we removed or moved a component but not during an add action', async () => {
            const wrapper = shallowMount(FormDesigner, {
              props: {},
              global: {
                plugins: [pinia],
                stubs: STUBS,
              },
            });
            await flushPromises();
            wrapper.vm.patch.index = 0;
            wrapper.vm.formSchema = {
              components: [
                {
                  id: '123',
                },
              ],
              display: 'form',
              type: 'form',
            };
            wrapper.vm.patch.history = [
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
            ];
            expect(wrapper.vm.patch.history).toEqual([
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
            ]);

            wrapper.vm.formSchema = {
              components: [],
              display: 'form',
              type: 'form',
            };
            wrapper.vm.patch.componentAddedStart = false;
            wrapper.vm.patch.componentRemovedStart = true;
            // Simulate a remove action
            wrapper.vm.onSchemaChange(
              [
                {
                  components: [],
                  display: 'form',
                  type: 'form',
                },
              ],
              undefined,
              undefined
            );
            expect(wrapper.vm.patch.history).toEqual([
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
              [{ op: 'remove', path: '/components/0' }],
            ]);

            wrapper.vm.patch.index = 0;
            wrapper.vm.formSchema = {
              components: [
                {
                  id: '123',
                  components: [{ id: '124' }],
                },
              ],
              display: 'form',
              type: 'form',
            };
            wrapper.vm.patch.history = [
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
            ];
            expect(wrapper.vm.patch.history).toEqual([
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
            ]);

            wrapper.vm.formSchema = {
              components: [
                {
                  id: '123',
                  components: [],
                },
                {
                  id: '124',
                },
              ],
              display: 'form',
              type: 'form',
            };
            wrapper.vm.patch.componentAddedStart = false;
            wrapper.vm.patch.componentRemovedStart = false;
            wrapper.vm.patch.componentMovedStart = true;
            // Simulate a move action
            wrapper.vm.onSchemaChange(
              [
                {
                  components: [{ id: '123', components: [] }, { id: '124' }],
                  display: 'form',
                  type: 'form',
                },
              ],
              undefined,
              undefined
            );
            expect(wrapper.vm.patch.history).toEqual([
              [
                {
                  op: 'add',
                  path: '/components/0',
                  value: { id: '123' },
                },
              ],
              [
                { op: 'add', path: '/components/0/components', value: [] },
                { op: 'add', path: '/components/1', value: { id: '124' } },
              ],
            ]);
          });
        });
        describe('flags/modified are defined', () => {
          it('component was added and save was clicked', async () => {
            const wrapper = shallowMount(FormDesigner, {
              props: {},
              global: {
                plugins: [pinia],
                stubs: STUBS,
              },
            });
            await flushPromises();
            wrapper.vm.patch.undoClicked = false;
            wrapper.vm.patch.redoClicked = false;
            wrapper.vm.patch.componentAddedStart = true;
            wrapper.vm.patch.componentMovedStart = false;
            wrapper.vm.patch.componentRemovedStart = false;
            wrapper.vm.patch.index = -1;
            wrapper.vm.formSchema = {
              components: [{ id: '123' }],
              display: 'form',
              type: 'form',
            };
            wrapper.vm.onSchemaChange(
              { id: '123' },
              { id: '123' },
              { components: [{ id: '123' }], display: 'form', type: 'form' }
            );
            // Add patch to history should be called
            expect(wrapper.vm.patch.history).toEqual([
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
            ]);
            expect(addNotificationSpy).toBeCalledTimes(0);
          });
          it('component was added and save was clicked it should add a notification if one of the components uses a reserved property name', async () => {
            const wrapper = shallowMount(FormDesigner, {
              props: {},
              global: {
                plugins: [pinia],
                stubs: STUBS,
              },
            });
            await flushPromises();
            wrapper.vm.patch.undoClicked = false;
            wrapper.vm.patch.redoClicked = false;
            wrapper.vm.patch.componentAddedStart = true;
            wrapper.vm.patch.componentMovedStart = false;
            wrapper.vm.patch.componentRemovedStart = false;
            wrapper.vm.patch.index = -1;
            wrapper.vm.formSchema = {
              components: [{ id: '123' }],
              display: 'form',
              type: 'form',
            };
            wrapper.vm.onSchemaChange(
              { id: '123' },
              { id: '123' },
              {
                components: [{ id: '123', key: 'form' }],
                display: 'form',
                type: 'form',
              }
            );
            // Add patch to history should be called
            expect(wrapper.vm.patch.history).toEqual([
              [{ op: 'add', path: '/components/0', value: { id: '123' } }],
            ]);
            expect(addNotificationSpy).toBeCalledTimes(1);
          });
        });
        it('component was edited and save was clicked or paste occurred', async () => {
          const wrapper = shallowMount(FormDesigner, {
            props: {},
            global: {
              plugins: [pinia],
              stubs: STUBS,
            },
          });
          await flushPromises();
          wrapper.vm.patch.undoClicked = false;
          wrapper.vm.patch.redoClicked = false;
          wrapper.vm.patch.componentAddedStart = false;
          wrapper.vm.patch.componentMovedStart = false;
          wrapper.vm.patch.componentRemovedStart = false;
          wrapper.vm.patch.index = -1;
          wrapper.vm.formSchema = {
            components: [{ id: '123' }],
            display: 'form',
            type: 'form',
          };
          wrapper.vm.onSchemaChange(
            { id: '123' },
            { id: '123' },
            { components: [{ id: '123' }], display: 'form', type: 'form' }
          );
          // Add patch to history should be called
          expect(wrapper.vm.patch.history).toEqual([
            [{ op: 'add', path: '/components/0', value: { id: '123' } }],
          ]);
          expect(addNotificationSpy).toBeCalledTimes(0);
        });
      });
      it('tab was changed, so form is not really changed, resetHistoryFlags', async () => {
        const wrapper = shallowMount(FormDesigner, {
          props: {},
          global: {
            plugins: [pinia],
            stubs: STUBS,
          },
        });
        await flushPromises();
        wrapper.vm.patch.undoClicked = false;
        wrapper.vm.patch.redoClicked = false;
        wrapper.vm.patch.componentAddedStart = false;
        wrapper.vm.patch.componentMovedStart = false;
        wrapper.vm.patch.componentRemovedStart = false;
        wrapper.vm.patch.index = -1;
        wrapper.vm.formSchema = {
          components: [{ id: '123' }],
          display: 'form',
          type: 'form',
        };
        wrapper.vm.onSchemaChange({ id: '123' }, { id: '123' }, false);
        expect(wrapper.vm.patch.history).toEqual([]);
        expect(addNotificationSpy).toBeCalledTimes(0);
        expect(wrapper.vm.patch.componentAddedStart).toBeFalsy();
        expect(wrapper.vm.patch.componentMovedStart).toBeFalsy();
        expect(wrapper.vm.patch.componentRemovedStart).toBeFalsy();
      });
    });
  });

  describe('formio event handlers', () => {
    it('init should call setDirtyFlag to false', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.init();

      expect(setDirtyFlagSpy).toBeCalledTimes(1);
      expect(setDirtyFlagSpy).toBeCalledWith(false);
    });

    it('onChangeMethod will setDirtyFlag to true if the form is not dirty', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.form.isDirty = true;
      wrapper.vm.onChangeMethod();

      expect(wrapper.vm.form.isDirty).toBeTruthy();
    });

    it('onRenderMethod will setDirtyFlag to false', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      const querySelectorSpy = vi.spyOn(document, 'querySelector');
      querySelectorSpy.mockImplementationOnce(() => {
        return '';
      });

      await flushPromises();

      wrapper.vm.onRenderMethod();

      expect(wrapper.vm.reRenderFormIo).toEqual(1);
      expect(wrapper.vm.form.isDirty).toBeFalsy();
    });

    it('onAddSchemaComponent will set componentAddedStart to true if the isNew flag is true', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(wrapper.vm.patch.componentAddedStart).toBeFalsy();
      expect(wrapper.vm.patch.componentMovedStart).toBeFalsy();

      wrapper.vm.onAddSchemaComponent(
        undefined,
        undefined,
        undefined,
        undefined,
        false
      );

      expect(wrapper.vm.patch.componentMovedStart).toBeTruthy();

      wrapper.vm.onAddSchemaComponent(
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );
      expect(wrapper.vm.patch.componentAddedStart).toBeTruthy();
    });

    it('onRemoveSchemaComponent will set componentRemovedStart to true', async () => {
      const wrapper = shallowMount(FormDesigner, {
        props: {},
        global: {
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(wrapper.vm.patch.componentRemovedStart).toBeFalsy();

      wrapper.vm.onRemoveSchemaComponent();

      expect(wrapper.vm.patch.componentRemovedStart).toBeTruthy();
    });
  });

  it('loadFile will set the form schema and add to patch history', async () => {
    const importFormSchemaFromFileSpy = vi.spyOn(
      formComposables,
      'importFormSchemaFromFile'
    );
    importFormSchemaFromFileSpy.mockImplementationOnce(() => {
      return Promise.resolve(
        JSON.stringify({
          components: [
            {
              id: '123',
            },
          ],
          display: 'form',
          type: 'form',
        })
      );
    });
    const wrapper = shallowMount(FormDesigner, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.loadFile({ target: { files: [0] } });

    expect(wrapper.vm.patch.history).toEqual([
      [{ op: 'add', path: '/components/0', value: { id: '123' } }],
    ]);
  });

  it('loadFile will addNotification if an error occurs', async () => {
    const importFormSchemaFromFileSpy = vi.spyOn(
      formComposables,
      'importFormSchemaFromFile'
    );
    importFormSchemaFromFileSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const wrapper = shallowMount(FormDesigner, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.loadFile({ target: { files: [0] } });

    expect(wrapper.vm.patch.history).toEqual([]);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
});
