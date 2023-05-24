import { cloneDeep } from 'lodash';

import { adminService } from '@/services';
import store from '@/store/modules/admin';

jest.mock('@/services');

describe('admin actions', () => {
  const mockStore = {
    commit: jest.fn(),
    dispatch: jest.fn(),
    state: cloneDeep(store.state),
  };
  const mockConsoleError = jest.spyOn(console, 'error');

  beforeEach(() => {
    mockStore.commit.mockReset();
    mockStore.dispatch.mockReset();
    mockStore.state = cloneDeep(store.state);
    mockConsoleError.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('admin forms actions', () => {
    it('adminFormUser should dispatch to notifications/addNotification on an error', async () => {
      adminService.addFormUser.mockRejectedValue('');
      await store.actions.addFormUser(mockStore, { formId: 'fId', userId: 'usrId', role: 'OWNER' });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('adminFormUser should dispatch a success notification when the service call resolves', async () => {
      adminService.addFormUser.mockResolvedValue({ data: { form: {} } });
      await store.actions.addFormUser(mockStore, { formId: 'fId', userId: 'usrId', roles: ['OWNER'] });

      expect(adminService.addFormUser).toHaveBeenCalledWith('usrId', 'fId', ['OWNER']);
      expect(adminService.addFormUser).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('deleteApiKey should commit to SET_API_KEY', async () => {
      adminService.deleteApiKey.mockResolvedValue({ data: { form: {} } });
      await store.actions.deleteApiKey(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_API_KEY', undefined);
    });

    it('deleteApiKey should dispatch to notifications/addNotification', async () => {
      adminService.deleteApiKey.mockRejectedValue('');
      await store.actions.deleteApiKey(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('readForm should commit to SET_FORM', async () => {
      adminService.readForm.mockResolvedValue({ data: { form: {} } });
      await store.actions.readForm(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM', expect.any(Object));
    });

    it('readForm should dispatch to notifications/addNotification', async () => {
      adminService.readForm.mockRejectedValue('');
      await store.actions.readForm(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });
    it('readRoles should commit to SET_ROLES', async () => {
      adminService.readRoles.mockResolvedValue({ data: { form: {} } });
      await store.actions.readRoles(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_ROLES', expect.any(Object));
    });

    it('readRoles should dispatch to notifications/addNotification', async () => {
      adminService.readRoles.mockRejectedValue('');
      await store.actions.readRoles(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('readApiDetails should commit to SET_API_KEY', async () => {
      adminService.readApiDetails.mockResolvedValue({ data: { form: {} } });
      await store.actions.readApiDetails(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_API_KEY', expect.any(Object));
    });

    it('readApiDetails should dispatch to notifications/addNotification', async () => {
      adminService.readApiDetails.mockRejectedValue('');
      await store.actions.readApiDetails(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('getForms should commit to SET_FORMLIST', async () => {
      adminService.listForms.mockResolvedValue({ data: [] });
      await store.actions.getForms(mockStore, true);

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORMLIST', expect.any(Array));
    });

    it('fetchDrafts should dispatch to notifications/addNotification', async () => {
      adminService.listForms.mockRejectedValue('');
      await store.actions.getForms(mockStore, true);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('restoreForm should commit to SET_FORM', async () => {
      adminService.restoreForm.mockResolvedValue({ data: { form: {} } });
      await store.actions.restoreForm(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM', { form: {} });
    });

    it('restoreForm should dispatch to notifications/addNotification', async () => {
      adminService.restoreForm.mockRejectedValue('');
      await store.actions.restoreForm(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('getUsers should commit to SET_USERLIST', async () => {
      adminService.listUsers.mockResolvedValue([]);
      await store.actions.getUsers(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_USERLIST', expect.any(Object));
    });

    it('getUsers should dispatch to notifications/addNotification', async () => {
      adminService.listUsers.mockRejectedValue('');
      await store.actions.getUsers(mockStore);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('readUser should commit to SET_USER', async () => {
      adminService.readUser.mockResolvedValue({});
      await store.actions.readUser(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_USER', expect.any(Object));
    });

    it('readUser should dispatch to notifications/addNotification', async () => {
      adminService.readUser.mockRejectedValue('');
      await store.actions.readUser(mockStore);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('addFCProactiveHelp should commit to SET_FCPROACTIVEHELP', async () => {
      adminService.addFCProactiveHelp.mockResolvedValue({});
      await store.actions.addFCProactiveHelp(mockStore, {});

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FCPROACTIVEHELP', expect.any(Object));
    });

    it('addFCProactiveHelp should commit to SET_FCPROACTIVEHELPGROUPLIST', async () => {
      adminService.listFCProactiveHelp.mockResolvedValue({});
      await store.actions.listFCProactiveHelp(mockStore, {});

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FCPROACTIVEHELPGROUPLIST', expect.any(Object));
    });

    it('updateFCProactiveHelpStatus should update publish status and commit to SET_FCPROACTIVEHELP', async () => {
      adminService.updateFCProactiveHelpStatus.mockRejectedValue('');
      await store.actions.updateFCProactiveHelpStatus(mockStore, { componentId: '5b97417a-252c-46c2-b132-85adac5ab3bc', publishStatus: true });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });
  });
});
