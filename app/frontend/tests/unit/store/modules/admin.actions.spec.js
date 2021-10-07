import { cloneDeep } from 'lodash';

import { adminService } from '@/services';
import store from '@/store/modules/admin';

jest.mock('@/services');

describe('admin actions', () => {
  const mockStore = {
    commit: jest.fn(),
    dispatch: jest.fn(),
    state: cloneDeep(store.state)
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
    it('deleteApiKey should commit to SET_API_KEY', async () => {
      adminService.deleteApiKey.mockResolvedValue({ data: { form: {} } });
      await store.actions.deleteApiKey(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_API_KEY', expect.any(Object));
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

    it('readApiDetails should commit to SET_API_KEY', async () => {
      adminService.readApiDetails.mockResolvedValue({ data: { form: {} } });
      await store.actions.readApiDetails(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
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
  });
});
