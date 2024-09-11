// @vitest-environment happy-dom
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import FormDesigner from '~/components/designer/FormDesigner.vue';
import formioIl8next from '~/internationalization/trans/formio/formio.json';
import templateExtensions from '~/plugins/templateExtensions';
import { formService } from '~/services';
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
        labels: [],
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
    addNotificationSpy.mockImplementationOnce(() => {});

    getProxyHeadersSpy.mockReset();
    getProxyHeadersSpy.mockImplementation(() => {
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
      expect(createFormSpy).toBeCalledTimes(1);
      expect(createDraftSpy).toBeCalledTimes(0);
      expect(updateDraftSpy).toBeCalledTimes(0);
      expect(push).toBeCalledTimes(1);
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
      expect(createFormSpy).toBeCalledTimes(0);
      expect(createDraftSpy).toBeCalledTimes(0);
      expect(updateDraftSpy).toBeCalledTimes(1);
      expect(replace).toBeCalledTimes(1);
    });
  });
});
