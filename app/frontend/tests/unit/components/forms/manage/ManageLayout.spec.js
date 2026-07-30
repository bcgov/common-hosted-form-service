import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions } from '~/utils/constants';
import { ref } from 'vue';
import { useAppStore } from '~/store/app';

describe('ManageLayout.vue', () => {
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders', () => {
    const wrapper = mount(ManageLayout, {
      props: {
        f: 'f',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.manageLayout.manageForm');
  });

  it('calls the store actions', async () => {
    const formId = '123-456';
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    const fetchDraftsSpy = vi.spyOn(formStore, 'fetchDrafts');
    fetchDraftsSpy.mockImplementationOnce(() => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    mount(ManageLayout, {
      props: {
        f: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    await flushPromises();

    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
    expect(getFormPermissionsForUserSpy).toHaveBeenCalledTimes(1);
    expect(fetchDraftsSpy).toHaveBeenCalledTimes(0);
  });

  it('shows the form name', async () => {
    formStore.fetchForm.mockImplementation(() => {
      formStore.form.name = 'myForm';
    });
    formStore.getFormPermissionsForUser.mockImplementation(() => [
      'design_read',
    ]);
    const wrapper = mount(ManageLayout, {
      props: {
        f: 'f',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('myForm');
  });

  it('calls the store actions also calls fetchDrafts if they have permissions to read the form design', async () => {
    const formId = '123-456';
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    const fetchDraftsSpy = vi.spyOn(formStore, 'fetchDrafts');
    fetchDraftsSpy.mockImplementationOnce(() => {});
    formStore.permissions = ref([FormPermissions.DESIGN_READ]);
    mount(ManageLayout, {
      props: {
        f: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    await flushPromises();

    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
    expect(getFormPermissionsForUserSpy).toHaveBeenCalledTimes(1);
    expect(fetchDraftsSpy).toHaveBeenCalledTimes(1);
  });

  // Regression: CCP-5326. The backend omits the `versions` list for non-designer
  // roles (e.g. team_manager, who lack design_create), so the fetched form has no
  // `versions` key. That must not be treated as "no permission" — the user is
  // already authorized by BaseSecure + backend form_read middleware to be here.
  it('loads permissions and shows no unauthorized alert when the form has no versions', async () => {
    formStore.fetchForm.mockImplementation(() => {
      // Mimic readForm returning a form payload without a `versions` key.
      formStore.form = { id: 'f', name: 'myForm' };
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    const notificationStore = useNotificationStore(pinia);
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    mount(ManageLayout, {
      props: {
        f: 'f',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    await flushPromises();

    expect(getFormPermissionsForUserSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).not.toHaveBeenCalled();
  });
});
