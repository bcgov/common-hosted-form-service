import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';
import { ref } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import ManageForm from '~/components/forms/manage/ManageForm.vue';
import getRouter from '~/router';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions } from '~/utils/constants';
import { useAppStore } from '~/store/app';

const STUBS = {
  VDataTable: {
    template: '<div class="v-data-table-stub"><slot /></div>',
  },
  FormSettings: {
    template: '<v-text-field class="form-settings" />',
  },
  ApiKey: {
    template: '<div class="api-key-stub"><slot /></div>',
  },
  ManageVersions: {
    template: '<div class="manage-versions-stub"><slot /></div>',
  },
  Subscription: {
    template: '<div class="subscription-stub"><slot /></div>',
  },
  FormProfile: {
    template: '<v-text-field class="form-profile-stub" />',
  },
};

describe('ManageForm.vue', () => {
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const appStore = useAppStore(pinia);
  const readFormSpy = vi.spyOn(formStore, 'readFormSubscriptionData');
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    appStore.$reset();
    readFormSpy.mockReset();
    addNotificationSpy.mockReset();
    readFormSpy.mockImplementationOnce(async () => {});
  });

  it('does not call readFormSubscriptionData without permission', () => {
    formStore.permissions = [];
    mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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
    expect(readFormSpy).not.toHaveBeenCalled();
  });

  it('calls readFormSubscriptionData with correct permissions', async () => {
    formStore.permissions = [FormPermissions.FORM_UPDATE];
    mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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

    expect(readFormSpy).toBeCalledTimes(1);
  });

  it('currentVersion returns N/A if the form has no versions', async () => {
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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
      },
    });

    await flushPromises();

    expect(wrapper.vm.currentVersion).toEqual('N/A');
  });

  it('currentVersion returns the current published version', async () => {
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
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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

    expect(wrapper.vm.currentVersion).toEqual(2);
  });

  it('isSubscribed will return true if subscribe is enabled', async () => {
    formStore.form = ref({
      subscribe: {
        enabled: true,
      },
    });
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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

    expect(wrapper.vm.isSubscribed).toBeTruthy();
  });

  it('isSubscribed will return false if subscribe is not enabled', async () => {
    formStore.form = ref({
      subscribe: {
        enabled: false,
      },
    });
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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
    expect(wrapper.vm.isSubscribed).toBeFalsy();
  });

  it('cancelSettingsEdit should call fetchForm and disable form settings', async () => {
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockImplementationOnce(() => {});
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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

    wrapper.vm.formSettingsDisabled = false;

    await flushPromises();

    expect(wrapper.vm.formSettingsDisabled).toBeFalsy();

    await wrapper.vm.cancelSettingsEdit();
    await flushPromises();
    expect(wrapper.vm.formSettingsDisabled).toBeTruthy();
    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
  });

  it('enableSettingsEdit should set settings panel to 0 and enable form settings', async () => {
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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

    expect(wrapper.vm.formSettingsDisabled).toBeTruthy();

    wrapper.vm.enableSettingsEdit();
    await flushPromises();
    expect(wrapper.vm.formSettingsDisabled).toBeFalsy();
  });

  it('onSubscription should set the value of the subscriptions panel', async () => {
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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

    expect(wrapper.vm.subscriptionsPanel).toEqual(0);

    wrapper.vm.onSubscription(1);
    await flushPromises();
    expect(wrapper.vm.subscriptionsPanel).toEqual(1);
  });

  it('update settings should add a notification and fetch form if it succeeds', async () => {
    formStore.form = ref({
      id: '1',
    });
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockImplementationOnce(() => {});
    const updateFormSpy = vi.spyOn(formStore, 'updateForm');
    updateFormSpy.mockImplementationOnce(() => {});
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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
      attachToDocument: true,
    });

    wrapper.vm.settingsPanel = ref(0);
    wrapper.vm.settingsFormValid = ref(true);
    wrapper.vm.formSettingsDisabled = ref(false);

    await flushPromises();

    wrapper.vm.enableSettingsEdit();

    await flushPromises();

    await wrapper.vm.updateSettings();

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
  });

  it('update settings should add a notification and not fetch form if it fails', async () => {
    formStore.form = ref({
      id: '1',
    });
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockImplementationOnce(() => {});
    const updateFormSpy = vi.spyOn(formStore, 'updateForm');
    updateFormSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const wrapper = mount(ManageForm, {
      global: {
        plugins: [router, pinia],
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
      attachToDocument: true,
    });

    wrapper.vm.settingsPanel = ref(0);
    wrapper.vm.settingsFormValid = ref(true);
    wrapper.vm.formSettingsDisabled = ref(false);

    await flushPromises();

    wrapper.vm.enableSettingsEdit();

    await flushPromises();

    await wrapper.vm.updateSettings();

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(fetchFormSpy).toHaveBeenCalledTimes(0);
  });
});
