import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import getRouter from '~/router';
import TeamManagement from '~/components/forms/manage/TeamManagement.vue';
import { rbacService, roleService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { useNotificationStore } from '~/store/notification';
import {
  AppPermissions,
  FormPermissions,
  FormRoleCodes,
  IdentityMode,
} from '~/utils/constants';

const ROLES = require('../../../fixtures/roles.json');
const IDIR_USER = require('../../../fixtures/idir_user.json');

const STUBS = {
  VTextField: {
    template: '<div class="v-text-field-stub"><slot /></div>',
  },
  VSelect: {
    template: '<div class="v-select-stub"><slot /></div>',
  },
  VDataTable: {
    template: '<div class="v-data-table-stub"><slot /></div>',
  },
};

const IDIR = {
  active: true,
  login: true,
  code: 'idir',
  display: 'IDIR',
  extra: {},
  idp: 'idir',
  permissions: [
    AppPermissions.VIEWS_FORM_STEPPER,
    AppPermissions.VIEWS_ADMIN,
    AppPermissions.VIEWS_FILE_DOWNLOAD,
    AppPermissions.VIEWS_FORM_EMAILS,
    AppPermissions.VIEWS_FORM_EXPORT,
    AppPermissions.VIEWS_FORM_MANAGE,
    AppPermissions.VIEWS_FORM_PREVIEW,
    AppPermissions.VIEWS_FORM_SUBMISSIONS,
    AppPermissions.VIEWS_FORM_TEAMS,
    AppPermissions.VIEWS_FORM_VIEW,
    AppPermissions.VIEWS_USER_SUBMISSIONS,
  ],
  primary: true,
  roles: [
    FormRoleCodes.OWNER,
    FormRoleCodes.TEAM_MANAGER,
    FormRoleCodes.FORM_DESIGNER,
    FormRoleCodes.SUBMISSION_APPROVER,
    FormRoleCodes.SUBMISSION_REVIEWER,
    FormRoleCodes.FORM_SUBMITTER,
  ],
  tokenmap: {
    idp: 'identity_provider',
    email: 'email',
    fullName: 'name',
    lastName: 'family_name',
    username: 'idir_username',
    firstName: 'given_name',
    idpUserId: 'idir_user_guid',
    keycloakId: 'idir_user_guid',
  },
};

const BCEIDBASIC = {
  active: true,
  login: true,
  code: 'bceid-basic',
  display: 'Basic BCeID',
  extra: {
    addTeamMemberSearch: {
      email: {
        exact: true,
        message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
      },
      text: {
        message: 'trans.manageSubmissionUsers.searchInputLength',
        minLength: 4,
      },
    },
    userSearch: {
      detail: 'Could not retrieve BCeID users. Invalid options provided.',
      filters: [
        {
          name: 'filterIdpUserId',
          param: 'idpUserId',
          required: 0,
        },
        {
          name: 'filterIdpCode',
          param: 'idpCode',
          required: 0,
        },
        {
          name: 'filterUsername',
          param: 'username',
          exact: true,
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterFullName',
          param: 'fullName',
          required: 0,
        },
        {
          name: 'filterFirstName',
          param: 'firstName',
          required: 0,
        },
        {
          name: 'filterLastName',
          param: 'lastName',
          required: 0,
        },
        {
          name: 'filterEmail',
          exact: true,
          param: 'email',
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterSearch',
          param: 'search',
          required: 0,
        },
      ],
    },
  },
  idp: 'bceidbasic',
  permissions: [AppPermissions.VIEWS_USER_SUBMISSIONS],
  primary: false,
  roles: [FormRoleCodes.FORM_SUBMITTER],
  tokenmap: {
    idp: 'identity_provider',
    email: 'email',
    fullName: 'name',
    lastName: null,
    username: 'bceid_username',
    firstName: null,
    idpUserId: 'bceid_user_guid',
    keycloakId: 'bceid_user_guid',
  },
};

const BCEIDBUSINESS = {
  active: true,
  login: true,
  code: 'bceid-business',
  display: 'Business BCeID',
  extra: {
    addTeamMemberSearch: {
      email: {
        exact: true,
        message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
      },
      text: {
        message: 'trans.manageSubmissionUsers.searchInputLength',
        minLength: 4,
      },
    },
    formAccessSettings: 'idim',
    userSearch: {
      detail: 'Could not retrieve BCeID users. Invalid options provided.',
      filters: [
        {
          name: 'filterIdpUserId',
          param: 'idpUserId',
          required: 0,
        },
        {
          name: 'filterIdpCode',
          param: 'idpCode',
          required: 0,
        },
        {
          name: 'filterUsername',
          param: 'username',
          exact: true,
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterFullName',
          param: 'fullName',
          required: 0,
        },
        {
          name: 'filterFirstName',
          param: 'firstName',
          required: 0,
        },
        {
          name: 'filterLastName',
          param: 'lastName',
          required: 0,
        },
        {
          name: 'filterEmail',
          exact: true,
          param: 'email',
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterSearch',
          param: 'search',
          required: 0,
        },
      ],
    },
  },
  idp: 'bceidbusiness',
  permissions: [
    AppPermissions.VIEWS_FORM_EXPORT,
    AppPermissions.VIEWS_FORM_MANAGE,
    AppPermissions.VIEWS_FORM_SUBMISSIONS,
    AppPermissions.VIEWS_FORM_TEAMS,
    AppPermissions.VIEWS_FORM_VIEW,
    AppPermissions.VIEWS_USER_SUBMISSIONS,
  ],
  primary: false,
  roles: [
    FormRoleCodes.TEAM_MANAGER,
    FormRoleCodes.SUBMISSION_REVIEWER,
    FormRoleCodes.FORM_SUBMITTER,
    FormRoleCodes.SUBMISSION_APPROVER,
  ],
  tokenmap: {
    idp: 'identity_provider',
    email: 'email',
    fullName: 'name',
    lastName: null,
    username: 'bceid_username',
    firstName: null,
    idpUserId: 'bceid_user_guid',
    keycloakId: 'bceid_user_guid',
  },
};

const PUBLIC = {
  active: true,
  login: false,
  code: 'public',
  display: 'Public',
  extra: {},
  idp: 'public',
  permissions: [],
  primary: false,
  roles: null,
  tokenmap: null,
};

describe('TeamManagement.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const idpStore = useIdpStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
  const listRolesSpy = vi.spyOn(roleService, 'list');

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
    idpStore.$reset();
    notificationStore.$reset();
    fetchFormSpy.mockReset();
    listRolesSpy.mockReset();
  });

  it('renders', () => {
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    const removeMultiUsersSpy = vi.spyOn(rbacService, 'removeMultiUsers');
    fetchFormSpy.mockImplementationOnce(async () => {
      return {
        name: 'This is a form name',
        userType: 'team',
      };
    });
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    getFormUsersSpy.mockImplementationOnce(async () => {
      return {
        data: [IDIR_USER],
      };
    });
    setUserFormsSpy.mockImplementationOnce(async () => {});
    removeMultiUsersSpy.mockImplementationOnce(async () => {});
    formStore.form = {
      name: 'This is a form title',
    };
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = mount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.teamManagement.teamManagement');
    expect(wrapper.text()).toContain(formStore.form.name);
  });

  it('DeleteMessage returns delSelectedMembersWarning if there is at least 2 items to delete otherwise it returns delSelectedMemberWarning', async () => {
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [];
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.DeleteMessage).toEqual(
      'trans.teamManagement.delSelectedMemberWarning'
    );

    wrapper.vm.itemsToDelete = ['something', 'something else'];

    expect(wrapper.vm.DeleteMessage).toEqual(
      'trans.teamManagement.delSelectedMembersWarning'
    );
  });

  it('FILTER_HEADERS should return the DEFAULT_HEADERS without any of the values found in filterIgnore', async () => {
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [];
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.FILTER_HEADERS).toEqual(
      wrapper.vm.DEFAULT_HEADERS.filter(
        (h) => !wrapper.vm.filterIgnore.some((fd) => fd.key === h.key)
      )
    );
  });

  it('HEADERS should return the DEFAULT_HEADERS but ignore anything found in filterData and filterIgnore', async () => {
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [];
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // DEFAULT_HEADERS should only contain the default values
    expect(wrapper.vm.HEADERS).toEqual([
      { title: 'trans.teamManagement.fullName', key: 'fullName' },
      { title: 'trans.teamManagement.username', key: 'username' },
      {
        title: 'trans.teamManagement.identityProvider',
        key: 'identityProvider.code',
      },
      { title: '', key: 'actions', width: '1rem', sortable: false },
    ]);

    // If we filter that we only want the fullName, it should add what's in the filter
    // and also ignore filtering anything in filterIgnore which currently is actions by default
    wrapper.vm.filterData = ['fullName'];

    expect(wrapper.vm.HEADERS).toEqual([
      { title: 'trans.teamManagement.fullName', key: 'fullName' },
      { title: '', key: 'actions', width: '1rem', sortable: false },
    ]);
  });

  it('PRESELECTED_DATA should return the filterData if there is data or it will return the FILTER_HEADERS keys', async () => {
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [];
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // By default there is no filterData so it should return FILTER_HEADERS keys

    expect(wrapper.vm.PRESELECTED_DATA).toEqual(
      wrapper.vm.FILTER_HEADERS.map((fd) => fd.key)
    );

    // If we add filterData though, it'll return filterData
    wrapper.vm.filterData = ['fullName'];

    expect(wrapper.vm.PRESELECTED_DATA).toEqual(['fullName']);
  });

  it('getFormUsers should throw an error if the user can not manage the team', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [];
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [];
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(wrapper.vm.formUsers).toEqual([]);
  });

  it('getFormUsers should call rbacService.getFormUsers if it can manage the team and set formUsers', async () => {
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER],
      };
    });

    await flushPromises();

    formStore.permissions = [FormPermissions.TEAM_UPDATE];

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await wrapper.vm.getFormUsers();

    await flushPromises();

    expect(addNotificationSpy).toBeCalledTimes(0);
    // Gets called twice
    expect(getFormUsersSpy).toBeCalledTimes(2);
    // It should add the idp key to the formUser entries
    expect(wrapper.vm.formUsers).toEqual(
      [IDIR_USER].map((user) => {
        user.idp = idpStore.findByCode(user.user_idpCode);
        return user;
      })
    );
  });

  it('disableRole returns true if the specified header is FORM_SUBMITTER and userType is not team', async () => {
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });

    await flushPromises();

    expect(
      wrapper.vm.disableRole(
        FormRoleCodes.FORM_SUBMITTER,
        {
          identityProvider: {
            code: 'idir',
          },
        },
        IdentityMode.PUBLIC
      )
    ).toBeTruthy();
  });

  it('disableRole returns false if the header is not in the IDPs roles', async () => {
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    const idpStoreListRolesSpy = vi.spyOn(idpStore, 'listRoles');
    idpStoreListRolesSpy.mockImplementationOnce(() => {
      return [FormRoleCodes.OWNER];
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });

    await flushPromises();

    expect(
      wrapper.vm.disableRole(
        FormRoleCodes.OWNER,
        {
          identityProvider: {
            code: 'idir',
          },
        },
        IdentityMode.PUBLIC
      )
    ).toBeFalsy();
    expect(idpStoreListRolesSpy).toBeCalledTimes(1);
  });

  it('toggleRole calls setUserForms which calls the rbacService.setUserForms then getFormPermissionsForUser', async () => {
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.toggleRole(IDIR_USER);

    expect(setUserFormsSpy).toBeCalledTimes(1);
    // It gets called once in the mounted function as well
    expect(getFormPermissionsForUserSpy).toBeCalledTimes(2);
    expect(wrapper.vm.selectedUsers).toEqual([]);
  });

  it('setUserForms should addNotification with detailed error if an error is thrown', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {
      throw {
        response: {
          data: {
            detail: 'DETAILED ERROR MESSAGE',
          },
        },
      };
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.toggleRole(IDIR_USER);

    expect(setUserFormsSpy).toBeCalledTimes(1);
    // It gets called once in the mounted function as well
    expect(getFormPermissionsForUserSpy).toBeCalledTimes(2);
    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.teamManagement.setUserFormsConsoleErrMsg',
      text: 'DETAILED ERROR MESSAGE',
    });
    expect(wrapper.vm.selectedUsers).toEqual([]);
  });

  it('setUserForms should addNotification if an error is thrown', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {
      throw new Error();
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.toggleRole(IDIR_USER);

    expect(setUserFormsSpy).toBeCalledTimes(1);
    // It gets called once in the mounted function as well
    expect(getFormPermissionsForUserSpy).toBeCalledTimes(2);
    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.teamManagement.setUserFormsConsoleErrMsg',
      text: 'trans.teamManagement.setUserFormsErrMsg',
    });
    expect(wrapper.vm.selectedUsers).toEqual([]);
  });

  it('generateFormRoleUsers returns the keys of a user filtered by role', async () => {
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // Since this user doesn't have any roles added to the object it should return nothing
    expect(wrapper.vm.generateFormRoleUsers(IDIR_USER)).toEqual([]);

    let user = {
      ...IDIR_USER,
    };

    user[FormRoleCodes.OWNER] = true;
    user[FormRoleCodes.OWNER.TEAM_MANAGER] = false;
    user[FormRoleCodes.OWNER.FORM_DESIGNER] = false;
    user[FormRoleCodes.OWNER.SUBMISSION_APPROVER] = false;
    user[FormRoleCodes.OWNER.SUBMISSION_REVIEWER] = false;
    user[FormRoleCodes.OWNER.FORM_SUBMITTER] = false;
    // If we use a modified user object and add the roles, map out the formId and userId and role.
    expect(wrapper.vm.generateFormRoleUsers(user)).toEqual([
      {
        formId: IDIR_USER.formId,
        role: FormRoleCodes.OWNER,
        userId: IDIR_USER.userId,
      },
    ]);
  });

  it('addingUsers will set isAddingUsers to the specified value', async () => {
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.addingUsers(true);
    expect(wrapper.vm.isAddingUsers).toBeTruthy();
    wrapper.vm.addingUsers(false);
    expect(wrapper.vm.isAddingUsers).toBeFalsy();
  });

  it('addNewUsers will addNotification if user is already in the table', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    wrapper.vm.tableData = [
      {
        ...IDIR_USER,
      },
    ];

    wrapper.vm.addNewUsers([IDIR_USER], []);

    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      text: `${IDIR_USER.username}@${IDIR_USER.idpCode} trans.teamManagement.idpMessage`,
    });
  });

  it('addNewUsers will add users to the table if they are not there using roles', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    wrapper.vm.addNewUsers(
      [IDIR_USER],
      [
        FormRoleCodes.FORM_SUBMITTER,
        FormRoleCodes.FORM_DESIGNER,
        FormRoleCodes.SUBMISSION_APPROVER,
        FormRoleCodes.SUBMISSION_REVIEWER,
        FormRoleCodes.TEAM_MANAGER,
        FormRoleCodes.OWNER,
      ]
    );

    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('addNewUsers will add users to the table if they are not there', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    wrapper.vm.addNewUsers([IDIR_USER], []);

    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('onShowColumnDialog will sort FILTER_HEADERS then set showColumnsDialog to true', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.FILTER_HEADERS).toEqual([
      { title: 'trans.teamManagement.fullName', key: 'fullName' },
      { title: 'trans.teamManagement.username', key: 'username' },
      {
        title: 'trans.teamManagement.identityProvider',
        key: 'identityProvider.code',
      },
      {
        description: 'Owns the form',
        filterable: false,
        key: 'owner',
        title: 'Owner',
      },
      {
        description: 'Manages Team members for the form',
        filterable: false,
        key: 'team_manager',
        title: 'Team Manager',
      },
      {
        description: 'Designs the form',
        filterable: false,
        key: 'form_designer',
        title: 'Form Designer',
      },
      {
        description:
          "Can review all form submissions but can't edit the submission.",
        filterable: false,
        key: 'submission_approver',
        title: 'Approver',
      },
      {
        description: 'Can review and manage all form submissions',
        filterable: false,
        key: 'submission_reviewer',
        title: 'Reviewer',
      },
    ]);

    wrapper.vm.onShowColumnDialog();

    expect(wrapper.vm.FILTER_HEADERS).toEqual([
      {
        description: 'Can review and manage all form submissions',
        filterable: false,
        key: 'submission_reviewer',
        title: 'Reviewer',
      },
      {
        description:
          "Can review all form submissions but can't edit the submission.",
        filterable: false,
        key: 'submission_approver',
        title: 'Approver',
      },
      {
        description: 'Designs the form',
        filterable: false,
        key: 'form_designer',
        title: 'Form Designer',
      },
      {
        description: 'Manages Team members for the form',
        filterable: false,
        key: 'team_manager',
        title: 'Team Manager',
      },
      {
        description: 'Owns the form',
        filterable: false,
        key: 'owner',
        title: 'Owner',
      },
      {
        title: 'trans.teamManagement.identityProvider',
        key: 'identityProvider.code',
      },
      { title: 'trans.teamManagement.username', key: 'username' },
      { title: 'trans.teamManagement.fullName', key: 'fullName' },
    ]);

    expect(wrapper.vm.showColumnsDialog).toBeTruthy();
  });

  it('onRemoveClick will addNotification if there is only 1 user to remove', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    wrapper.vm.onRemoveClick();

    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('onRemoveClick will set itemsToDelete', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER, IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    wrapper.vm.onRemoveClick(['12345678-1234-1234-1234-123456789012']);

    // should try to remove
    expect(wrapper.vm.itemsToDelete).toEqual(
      wrapper.vm.tableData.filter((td) =>
        ['12345678-1234-1234-1234-123456789012'].includes(td.id)
      )
    );
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('onRemoveClick will set itemsToDelete to the item', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER, IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    wrapper.vm.onRemoveClick('12345678-1234-1234-1234-123456789012');

    // should try to remove
    expect(wrapper.vm.itemsToDelete).toEqual([
      '12345678-1234-1234-1234-123456789012',
    ]);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('removeUser will call removeMultiUsers, getFormPermissionsForUser', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const removeMultiUsersSpy = vi.spyOn(rbacService, 'removeMultiUsers');
    removeMultiUsersSpy.mockImplementationOnce(async () => {});
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER, IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    await wrapper.vm.removeUser();

    expect(removeMultiUsersSpy).toBeCalledTimes(1);
    // Gets called twice because of getFormUsers
    expect(getFormPermissionsForUserSpy).toBeCalledTimes(2);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('removeUser will addNotification with detailed message if an error occurs', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const removeMultiUsersSpy = vi.spyOn(rbacService, 'removeMultiUsers');
    removeMultiUsersSpy.mockImplementationOnce(async () => {
      throw {
        response: {
          data: {
            detail: 'DETAILED ERROR MESSAGE',
          },
        },
      };
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER, IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    await wrapper.vm.removeUser();

    expect(removeMultiUsersSpy).toBeCalledTimes(1);
    expect(getFormPermissionsForUserSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('removeUser will addNotification if an error occurs', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const removeMultiUsersSpy = vi.spyOn(rbacService, 'removeMultiUsers');
    removeMultiUsersSpy.mockImplementationOnce(async () => {
      throw new Error();
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER, IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    await flushPromises();

    await wrapper.vm.removeUser();

    expect(removeMultiUsersSpy).toBeCalledTimes(1);
    expect(getFormPermissionsForUserSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('updateFilter sets filterData and hides the columns dialog', async () => {
    listRolesSpy.mockImplementationOnce(async () => {
      return {
        data: ROLES,
      };
    });
    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];
    const setUserFormsSpy = vi.spyOn(rbacService, 'setUserForms');
    setUserFormsSpy.mockImplementationOnce(async () => {});
    const removeMultiUsersSpy = vi.spyOn(rbacService, 'removeMultiUsers');
    removeMultiUsersSpy.mockImplementationOnce(async () => {
      throw {
        response: {
          data: {
            detail: 'DETAILED ERROR MESSAGE',
          },
        },
      };
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementationOnce(async () => {
      return [FormPermissions.TEAM_UPDATE];
    });
    const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
    getFormUsersSpy.mockImplementation(async () => {
      return {
        data: [IDIR_USER, IDIR_USER],
      };
    });

    formStore.permissions = [FormPermissions.TEAM_UPDATE];
    const wrapper = shallowMount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.updateFilter(['something']);

    expect(wrapper.vm.filterData).toEqual(['something']);
    expect(wrapper.vm.showColumnsDialog).toBeFalsy();

    wrapper.vm.updateFilter();

    expect(wrapper.vm.filterData).toEqual([]);
    expect(wrapper.vm.showColumnsDialog).toBeFalsy();
  });
});
