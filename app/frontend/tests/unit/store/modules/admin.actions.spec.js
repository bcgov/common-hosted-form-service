import { setActivePinia, createPinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminService } from '~/services';
import { useAdminStore } from '~/store/admin';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

vi.mock('~/services');

describe('admin actions', () => {
  setActivePinia(createPinia());
  const mockStore = useAdminStore();
  const notificationStore = useNotificationStore();
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const addFormUserSpy = vi.spyOn(adminService, 'addFormUser');
  const readRolesSpy = vi.spyOn(adminService, 'readRoles');
  const mockConsoleError = vi.spyOn(console, 'error');

  beforeEach(() => {
    mockStore.$reset();
    notificationStore.$reset();
    addNotificationSpy.mockReset();
    addFormUserSpy.mockReset();
    readRolesSpy.mockReset();
    mockConsoleError.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    addNotificationSpy.mockRestore();
    addFormUserSpy.mockRestore();
    readRolesSpy.mockRestore();
  });

  describe('admin forms actions', () => {
    it('adminFormUser should dispatch to notifications/addNotification on an error', async () => {
      adminService.addFormUser.mockRejectedValue('');
      await mockStore.addFormUser({
        formId: 'fId',
        userId: 'usrId',
        role: 'OWNER',
      });
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.addRowError',
        text: 'trans.store.admin.addRowError',
      });
    });

    it('adminFormUser should dispatch a success notification when the service call resolves', async () => {
      adminService.addFormUser.mockResolvedValue({
        data: [{ fullName: 'User' }],
      });
      adminService.readRoles.mockResolvedValue({ data: ['OWNER'] });
      await mockStore.addFormUser({
        formId: 'fId',
        userId: 'usrId',
        roles: ['OWNER'],
      });

      expect(addFormUserSpy).toHaveBeenCalledWith('usrId', 'fId', ['OWNER']);
      expect(addFormUserSpy).toHaveBeenCalledTimes(1);
      expect(readRolesSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        text: 'trans.store.admin.addFormOwnerRole',
        ...NotificationTypes.SUCCESS,
      });
    });

    it('deleteApiKey should commit to SET_API_KEY', async () => {
      mockStore.apiKey = 'TEST';
      adminService.deleteApiKey.mockResolvedValue({ data: { form: {} } });
      await mockStore.deleteApiKey('fId');

      expect(mockStore.apiKey).toBe(undefined);
    });

    it('deleteApiKey should dispatch to notifications/addNotification', async () => {
      adminService.deleteApiKey.mockRejectedValue('');
      await mockStore.deleteApiKey('fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.apiKeyDelMsg',
        text: 'trans.store.admin.errDeletingApiKey',
      });
    });

    it('readForm should commit to SET_FORM', async () => {
      adminService.readForm.mockResolvedValue({
        data: { form: { id: 'fId' } },
      });
      await mockStore.readForm('fId');
      expect(mockStore.form).toEqual({ form: { id: 'fId' } });
    });

    it('readForm should dispatch to notifications/addNotification', async () => {
      adminService.readForm.mockRejectedValue('');
      await mockStore.readForm('fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.fecthingFormsErrMsg',
        text: 'trans.store.admin.fecthingFormErrMsg',
      });
    });

    it('readRoles should commit to SET_ROLES', async () => {
      adminService.readRoles.mockResolvedValue({ data: ['OWNER'] });
      await mockStore.readRoles('fId');

      expect(mockStore.roles).toEqual(['OWNER']);
    });

    it('readRoles should dispatch to notifications/addNotification', async () => {
      adminService.readRoles.mockRejectedValue();
      await mockStore.readRoles('fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.fecthFormUserRolesConsErrMsg',
        text: 'trans.store.admin.fecthFormUserRolesErrMsg',
      });
    });

    it('readApiDetails should commit to SET_API_KEY', async () => {
      mockStore.apiKey = undefined;
      adminService.readApiDetails.mockResolvedValue({ data: '' });
      await mockStore.readApiDetails('fId');

      expect(mockStore.apiKey).toEqual('');
    });

    it('readApiDetails should dispatch to notifications/addNotification', async () => {
      adminService.readApiDetails.mockRejectedValue('');
      await mockStore.readApiDetails('fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.fecthApiDetailsConsErrMsg',
        text: 'trans.store.admin.fecthApiDetailsErrMsg',
      });
    });

    it('getForms should commit to SET_FORMLIST', async () => {
      mockStore.formList = undefined;
      adminService.listForms.mockResolvedValue({ data: [{ form: { id: 1 } }] });
      await mockStore.getForms(true);

      expect(mockStore.formList).toEqual([{ form: { id: 1 } }]);
    });

    it('fetchDrafts should dispatch to notifications/addNotification', async () => {
      adminService.listForms.mockRejectedValue('');
      await mockStore.getForms(true);

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.fecthingFormsErrMsg',
        text: 'trans.store.admin.fecthingFormsErrMsg',
      });
    });

    it('restoreForm should commit to SET_FORM', async () => {
      mockStore.form = undefined;
      adminService.restoreForm.mockResolvedValue({ data: { form: {} } });
      await mockStore.restoreForm('fId');

      expect(mockStore.form).toEqual({ form: {} });
    });

    it('restoreForm should dispatch to notifications/addNotification', async () => {
      adminService.restoreForm.mockRejectedValue('');
      await mockStore.restoreForm('fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.restoreFormConsErrMsg',
        text: 'trans.store.admin.restoreFormErrMsg',
      });
    });

    it('getUsers should commit to SET_USERLIST', async () => {
      mockStore.userList = undefined;
      adminService.listUsers.mockResolvedValue({ data: [] });
      await mockStore.getUsers();

      expect(mockStore.userList).toEqual([]);
    });

    it('getUsers should dispatch to notifications/addNotification', async () => {
      adminService.listUsers.mockRejectedValue('');
      await mockStore.getUsers();

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.getUsersConsErrMsg',
        text: 'trans.store.admin.getUsersErrMsg',
      });
    });

    it('readUser should commit to SET_USER', async () => {
      mockStore.user = undefined;
      adminService.readUser.mockResolvedValue({ data: {} });
      await mockStore.readUser('userId');

      expect(mockStore.user).toEqual(expect.any(Object));
    });

    it('readUser should dispatch to notifications/addNotification', async () => {
      adminService.readUser.mockRejectedValue('');
      await mockStore.readUser('userId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.getUserConsErrMsg',
        text: 'trans.store.admin.getUserErrMsg',
      });
    });

    it('addFCProactiveHelp should commit to SET_FCPROACTIVEHELP', async () => {
      mockStore.fcProactiveHelp = undefined;
      adminService.addFCProactiveHelp.mockResolvedValue({ data: {} });
      await mockStore.addFCProactiveHelp({});

      expect(mockStore.fcProactiveHelp).toEqual({});
    });

    it('addFCProactiveHelp should commit to SET_FCPROACTIVEHELPGROUPLIST', async () => {
      mockStore.fcProactiveHelpGroupList = undefined;
      adminService.listFCProactiveHelp.mockResolvedValue({ data: [] });
      await mockStore.listFCProactiveHelp();

      expect(mockStore.fcProactiveHelpGroupList).toEqual([]);
    });

    it('updateFCProactiveHelpStatus should update publish status and commit to SET_FCPROACTIVEHELP', async () => {
      adminService.updateFCProactiveHelpStatus.mockRejectedValue('');
      await mockStore.updateFCProactiveHelpStatus({
        componentId: '5b97417a-252c-46c2-b132-85adac5ab3bc',
        publishStatus: true,
      });

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: 'trans.store.admin.updatingFCStatusConsErrMsg',
        text: 'trans.store.admin.updatingFCStatusErrMsg',
      });
    });
  });
});
