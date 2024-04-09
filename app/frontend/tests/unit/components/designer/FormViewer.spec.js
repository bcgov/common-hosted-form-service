import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import FormViewer from '~/components/designer/FormViewer.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

describe('FormViewer.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();

    authStore.keycloak = {
      tokenParsed: {
        identity_provider: 'idir',
        preferred_username: 'TEST',
        resource_access: 'chefs',
        realm_access: 'chefs',
        idp_userid: '123',
        idp_username: 'TEST',
        given_name: 'test',
        family_name: 'test',
        name: 'test',
        email: 'test@test.com',
      },
      authenticated: true,
    };
  });

  it('renders', async () => {
    const getFormSchemaSpy = vi.spyOn(FormViewer.methods, 'getFormSchema');
    const leaveThisPageSpy = vi.spyOn(FormViewer.methods, 'leaveThisPage');
    formStore.form = {
      name: 'This is a form title',
    };
    getFormSchemaSpy.mockImplementation(() => {});
    leaveThisPageSpy.mockImplementation(() => {});
    const wrapper = mount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [router, pinia],
        stubs: {
          BaseDialog: true,
          FormViewerMultiUpload: true,
          VSkeletonLoader: {
            name: 'VSkeletonLoader',
            template: '<div class="v-skeleton-loader-stub"><slot /></div>',
          },
          VContainer: {
            name: 'VContainer',
            template: '<div class="v-container-stub"><slot /></div>',
          },
          formio: {
            name: 'formio',
            template: '<div class="formio-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.setData({ form: { name: 'This is a form title' } });

    await flushPromises();

    expect(wrapper.html()).toContain(formStore.form.name);
  });

  it('when navigating away, it should not show the modal for submissions with drafts disabled', async () => {
    const getFormSchemaSpy = vi.spyOn(FormViewer.methods, 'getFormSchema');
    const leaveThisPageSpy = vi.spyOn(FormViewer.methods, 'leaveThisPage');
    formStore.form = {
      name: 'This is a form title',
    };
    getFormSchemaSpy.mockImplementation(() => {});
    leaveThisPageSpy.mockImplementation(() => {});
    const wrapper = mount(FormViewer, {
      props: {
        formId: formId,
        submissionId: '1',
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [router, pinia],
        stubs: {
          BaseDialog: true,
          FormViewerMultiUpload: true,
          VSkeletonLoader: {
            name: 'VSkeletonLoader',
            template: '<div class="v-skeleton-loader-stub"><slot /></div>',
          },
          VContainer: {
            name: 'VContainer',
            template: '<div class="v-container-stub"><slot /></div>',
          },
          formio: {
            name: 'formio',
            template: '<div class="formio-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.setData({
      form: { name: 'This is a form title', enableSubmitterDraft: false },
    });

    await flushPromises();

    wrapper.vm.showdoYouWantToSaveTheDraftModal();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeFalsy();
  });

  it('when navigating away, it should show the modal for submissions with drafts enabled', async () => {
    const getFormSchemaSpy = vi.spyOn(FormViewer.methods, 'getFormSchema');
    const leaveThisPageSpy = vi.spyOn(FormViewer.methods, 'leaveThisPage');
    formStore.form = {
      name: 'This is a form title',
    };
    getFormSchemaSpy.mockImplementation(() => {});
    leaveThisPageSpy.mockImplementation(() => {});
    const wrapper = mount(FormViewer, {
      props: {
        formId: formId,
        displayTitle: true,
      },
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [router, pinia],
        stubs: {
          BaseDialog: true,
          FormViewerMultiUpload: true,
          VSkeletonLoader: {
            name: 'VSkeletonLoader',
            template: '<div class="v-skeleton-loader-stub"><slot /></div>',
          },
          VContainer: {
            name: 'VContainer',
            template: '<div class="v-container-stub"><slot /></div>',
          },
          formio: {
            name: 'formio',
            template: '<div class="formio-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.setData({
      bulkFile: false,
      form: { name: 'This is a form title', enableSubmitterDraft: true },
      showModal: true,
    });

    await flushPromises();

    wrapper.vm.showdoYouWantToSaveTheDraftModal();

    expect(wrapper.vm.doYouWantToSaveTheDraft).toBeTruthy();
  });
});
