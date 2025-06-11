import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import getRouter from '~/router';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';
import { STUBS } from '../../stubs';

// Helper to set up wrapper and stores
function setupWrapper({
  formOverrides = {},
  userFormPreferences = {},
  formFields = [],
  permissions = [],
} = {}) {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  formStore.form = { ...require('../../fixtures/form.json'), ...formOverrides };

  formStore.userFormPreferences = userFormPreferences;
  formStore.formFields = formFields;
  formStore.permissions = permissions;

  vi.spyOn(formStore, 'fetchForm').mockImplementation(() => Promise.resolve());

  return {
    wrapper: shallowMount(SubmissionsTable, {
      props: { formId: 'test-form-id' },
      global: {
        plugins: [
          createRouter({
            history: createWebHistory(),
            routes: getRouter().getRoutes(),
          }),
          pinia,
        ],
        stubs: STUBS,
      },
    }),
    formStore,
    authStore,
    appStore,
  };
}

describe('SubmissionsTable.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and displays the page title', async () => {
    const { wrapper } = setupWrapper();
    await flushPromises();
    expect(wrapper.text()).toContain('trans.formsTable.submissions');
  });

  it('showFormManage is true when permissions allow', async () => {
    const { wrapper, formStore } = setupWrapper({
      permissions: ['FormManagePermissions'],
    });
    vi.spyOn(formStore, 'getFormPermissionsForUser').mockImplementation(() => {
      formStore.permissions = ['FormManagePermissions'];
    });
    await flushPromises();

    expect(wrapper.vm.showFormManage).toBe(true);

    // To test false, update the ref value and flush
    formStore.permissions.value = [];
    await flushPromises();
    expect(wrapper.vm.showFormManage).toBe(false);
  });

  it('showSelectColumns and showSubmissionsExport reflect permissions', async () => {
    const { wrapper, formStore } = setupWrapper();
    formStore.permissions = ['FormManagePermissions'];
    await flushPromises();
    expect(wrapper.vm.showSelectColumns).toBe(true);
    expect(wrapper.vm.showSubmissionsExport).toBe(true);
    formStore.permissions = [];
    await flushPromises();
    expect(wrapper.vm.showSelectColumns).toBe(false);
    expect(wrapper.vm.showSubmissionsExport).toBe(false);
  });

  it('showAssigneeColumn is true only when form has status updates and assignee enabled and not public', async () => {
    const { wrapper, formStore } = setupWrapper({
      formOverrides: {
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: true,
        identityProviders: [],
      },
    });
    expect(wrapper.vm.showAssigneeColumn).toBe(true);
    formStore.form.identityProviders = [{ code: 'PUBLIC' }];
    await flushPromises();
    expect(wrapper.vm.showAssigneeColumn).toBe(false);
    formStore.form.enableStatusUpdates = false;
    await flushPromises();
    expect(wrapper.vm.showAssigneeColumn).toBe(false);
  });

  it('userColumns filters columns by formFields', async () => {
    const { wrapper, formStore } = setupWrapper({
      userFormPreferences: {
        preferences: {
          submissionsTable: { columns: ['firstName', 'lastName'] },
        },
      },
      formFields: ['firstName'],
    });
    expect(wrapper.vm.userColumns).toEqual(['firstName']);
    formStore.userFormPreferences = {};
    await flushPromises();
    expect(wrapper.vm.userColumns).toEqual([]);
  });

  it('BASE_HEADERS includes assignee and lateEntry columns when enabled', async () => {
    const { wrapper } = setupWrapper({
      formOverrides: {
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: true,
        schedule: { enabled: true },
      },
      formFields: ['firstName'],
    });
    const headers = wrapper.vm.BASE_HEADERS;
    expect(headers.some((h) => h.key === 'assignee')).toBe(true);
    expect(headers.some((h) => h.key === 'lateEntry')).toBe(true);
  });

  it('HEADERS filters columns by user preferences', async () => {
    const { wrapper } = setupWrapper({
      userFormPreferences: {
        preferences: { submissionsTable: { columns: ['submitter'] } },
      },
      formFields: ['submitter'],
    });
    await flushPromises();
    expect(wrapper.vm.HEADERS.some((h) => h.key === 'submitter')).toBe(true);
  });

  it('delSub calls deleteSingleSubs or deleteMultiSubs', async () => {
    const { wrapper } = setupWrapper();
    wrapper.vm.singleSubmissionDelete = true;
    const singleSpy = vi
      .spyOn(wrapper.vm, 'deleteSingleSubs')
      .mockResolvedValue();
    const multiSpy = vi
      .spyOn(wrapper.vm, 'deleteMultiSubs')
      .mockResolvedValue();
    await wrapper.vm.delSub();
    expect(singleSpy).toBeCalled();
    wrapper.vm.singleSubmissionDelete = false;
    await wrapper.vm.delSub();
    expect(multiSpy).toBeCalled();
  });

  it('restoreSub calls restoreSingleSub or restoreMultipleSubs', async () => {
    const { wrapper } = setupWrapper();
    wrapper.vm.singleSubmissionRestore = true;
    const singleSpy = vi
      .spyOn(wrapper.vm, 'restoreSingleSub')
      .mockResolvedValue();
    const multiSpy = vi
      .spyOn(wrapper.vm, 'restoreMultipleSubs')
      .mockResolvedValue();
    await wrapper.vm.restoreSub();
    expect(singleSpy).toBeCalled();
    wrapper.vm.singleSubmissionRestore = false;
    await wrapper.vm.restoreSub();
    expect(multiSpy).toBeCalled();
  });

  it('handleSearch calls refreshSubmissions or debounceInput', async () => {
    const { wrapper } = setupWrapper();
    wrapper.vm.debounceInput = vi.fn();
    await wrapper.vm.handleSearch('something');
    expect(wrapper.vm.debounceInput).toBeCalled();
    const refreshSpy = vi
      .spyOn(wrapper.vm, 'refreshSubmissions')
      .mockResolvedValue();
    await wrapper.vm.handleSearch('');
    expect(refreshSpy).toBeCalled();
  });

  it('updateTableOptions sets page, itemsPP, and calls updateFormPreferences', async () => {
    const { wrapper } = setupWrapper();
    const updatePrefsSpy = vi
      .spyOn(wrapper.vm, 'updateFormPreferences')
      .mockResolvedValue();
    await wrapper.vm.updateTableOptions({
      page: 2,
      itemsPerPage: 5,
      sortBy: [{ key: 'date', order: 'desc' }],
    });
    expect(wrapper.vm.currentPage).toBe(2);
    expect(wrapper.vm.itemsPP).toBe(5);
    expect(updatePrefsSpy).toBeCalled();
  });

  it('onShowColumnDialog sorts BASE_FILTER_HEADERS and shows dialog', async () => {
    const { wrapper } = setupWrapper();
    wrapper.vm.onShowColumnDialog();
    expect(wrapper.vm.showColumnsDialog).toBe(true);
  });
});
