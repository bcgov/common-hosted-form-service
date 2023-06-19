import { setActivePinia, createPinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import { adminService } from '~/services';
import { useAdminStore } from '~/store/admin';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

vi.mock('vue-i18n');

createI18n.mockReturnValue({
  t: (tKey, params = {}) => {
    tKey, params;
  },
});

vi.mock('~/services');
vi.mock('~/internationalization', () => ({
  default: {
    global: { t: vi.fn(() => {}) },
  },
}));

describe('admin actions', () => {
  setActivePinia(createPinia());
  const mockStore = useAdminStore();
  const notificationStore = useNotificationStore();
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const mockConsoleError = vi.spyOn(console, 'error');

  beforeEach(() => {
    mockStore.$reset();
    notificationStore.$reset();
    mockConsoleError.mockReset();
    addNotificationSpy.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('admin forms actions', () => {
    it('adminFormUser should dispatch to notifications/addNotification on an error', async () => {
      adminService.addFormUser.mockRejectedValue('');
      await mockStore.addFormUser(mockStore, {
        formId: 'fId',
        userId: 'usrId',
        role: 'OWNER',
      });
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: undefined,
        text: undefined,
      });
    });

    it('adminFormUser should dispatch a success notification when the service call resolves', async () => {
      const addFormUserSpy = vi.spyOn(adminService, 'addFormUser');
      const readRolesSpy = vi.spyOn(adminService, 'readRoles');
      await mockStore.addFormUser({
        formId: 'fId',
        userId: 'usrId',
        roles: ['OWNER'],
      });

      expect(addFormUserSpy).toHaveBeenCalledWith('usrId', 'fId', ['OWNER']);
      expect(addFormUserSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith({
        text: undefined,
        ...NotificationTypes.SUCCESS,
      });
      expect(readRolesSpy).toHaveBeenCalledTimes(1);
    });
    /*    it('deleteApiKey should commit to SET_API_KEY', async () => {
      adminService.deleteApiKey.mockResolvedValue({ data: { form: {} } });
      await mockStore.deleteApiKey(mockStore, 'fId');

      expect(mockStore.apiKey).toBe(undefined);
    });

    it('deleteApiKey should dispatch to notifications/addNotification', async () => {
      adminService.deleteApiKey.mockRejectedValue('');
      await mockStore.deleteApiKey(mockStore, 'fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('readForm should commit to SET_FORM', async () => {
      adminService.readForm.mockResolvedValue({ data: { form: {} } });
      await mockStore.readForm(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_FORM',
        expect.any(Object)
      );
    });

    it('readForm should dispatch to notifications/addNotification', async () => {
      adminService.readForm.mockRejectedValue('');
      await mockStore.readForm(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });
    it('readRoles should commit to SET_ROLES', async () => {
      adminService.readRoles.mockResolvedValue({ data: { form: {} } });
      await mockStore.readRoles(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_ROLES',
        expect.any(Object)
      );
    });

    it('readRoles should dispatch to notifications/addNotification', async () => {
      adminService.readRoles.mockRejectedValue('');
      await mockStore.readRoles(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('readApiDetails should commit to SET_API_KEY', async () => {
      adminService.readApiDetails.mockResolvedValue({ data: { form: {} } });
      await mockStore.readApiDetails(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_API_KEY',
        expect.any(Object)
      );
    });

    it('readApiDetails should dispatch to notifications/addNotification', async () => {
      adminService.readApiDetails.mockRejectedValue('');
      await mockStore.readApiDetails(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('getForms should commit to SET_FORMLIST', async () => {
      adminService.listForms.mockResolvedValue({ data: [] });
      await mockStore.getForms(mockStore, true);

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_FORMLIST',
        expect.any(Array)
      );
    });

    it('fetchDrafts should dispatch to notifications/addNotification', async () => {
      adminService.listForms.mockRejectedValue('');
      await mockStore.getForms(mockStore, true);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('restoreForm should commit to SET_FORM', async () => {
      adminService.restoreForm.mockResolvedValue({ data: { form: {} } });
      await mockStore.restoreForm(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM', { form: {} });
    });

    it('restoreForm should dispatch to notifications/addNotification', async () => {
      adminService.restoreForm.mockRejectedValue('');
      await mockStore.restoreForm(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('getUsers should commit to SET_USERLIST', async () => {
      adminService.listUsers.mockResolvedValue([]);
      await mockStore.getUsers(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_USERLIST',
        expect.any(Object)
      );
    });

    it('getUsers should dispatch to notifications/addNotification', async () => {
      adminService.listUsers.mockRejectedValue('');
      await mockStore.getUsers(mockStore);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('readUser should commit to SET_USER', async () => {
      adminService.readUser.mockResolvedValue({});
      await mockStore.readUser(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_USER',
        expect.any(Object)
      );
    });

    it('readUser should dispatch to notifications/addNotification', async () => {
      adminService.readUser.mockRejectedValue('');
      await mockStore.readUser(mockStore);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('addFCProactiveHelp should commit to SET_FCPROACTIVEHELP', async () => {
      adminService.addFCProactiveHelp.mockResolvedValue({});
      await mockStore.addFCProactiveHelp(mockStore, {});

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_FCPROACTIVEHELP',
        expect.any(Object)
      );
    });

    it('addFCProactiveHelp should commit to SET_FCPROACTIVEHELPGROUPLIST', async () => {
      adminService.listFCProactiveHelp.mockResolvedValue({});
      await mockStore.listFCProactiveHelp(mockStore, {});

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith(
        'SET_FCPROACTIVEHELPGROUPLIST',
        expect.any(Object)
      );
    });

    it('updateFCProactiveHelpStatus should update publish status and commit to SET_FCPROACTIVEHELP', async () => {
      adminService.updateFCProactiveHelpStatus.mockRejectedValue('');
      await mockStore.updateFCProactiveHelpStatus(mockStore, {
        componentId: '5b97417a-252c-46c2-b132-85adac5ab3bc',
        publishStatus: true,
      });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'notifications/addNotification',
        expect.any(Object),
        expect.any(Object)
      );
    }); */
  });
});
