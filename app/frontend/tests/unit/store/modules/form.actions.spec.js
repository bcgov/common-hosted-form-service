import { cloneDeep } from 'lodash';

import { formService, rbacService, userService, adminService } from '@/services';
import store from '@/store/modules/form';

jest.mock('@/services');

describe('form actions', () => {
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

  describe('current user', () => {
    it('getFormsForCurrentUser should commit to SET_FORMLIST', async () => {
      rbacService.getCurrentUser.mockResolvedValue({ data: { forms: [] } });
      await store.actions.getFormsForCurrentUser(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORMLIST', expect.any(Array));
    });

    it('getFormsForCurrentUser should dispatch to notifications/addNotification', async () => {
      rbacService.getCurrentUser.mockRejectedValue('');
      await store.actions.getFormsForCurrentUser(mockStore);

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('getFormPermissionsForUser should commit to SET_FORM_PERMISSIONS', async () => {
      rbacService.getCurrentUser.mockResolvedValue({
        data: {
          forms: [
            {
              permissions: [],
            },
          ],
        },
      });
      await store.actions.getFormPermissionsForUser(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM_PERMISSIONS', expect.any(Array));
    });

    it('getFormPermissionsForUser should dispatch to notifications/addNotification', async () => {
      rbacService.getCurrentUser.mockResolvedValue({ data: { forms: [] } });
      await store.actions.getFormPermissionsForUser(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM_PERMISSIONS', expect.any(Array));
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('getFormPreferencesForCurrentUser should commit to SET_USER_FORM_PREFERENCES', async () => {
      userService.getUserFormPreferences.mockResolvedValue({
        data: {
          preferences: ['foo', 'bar'],
          userId: '123',
        },
      });
      await store.actions.getFormPreferencesForCurrentUser(mockStore, 'fId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_USER_FORM_PREFERENCES', expect.any(Object));
    });

    it('getFormPreferencesForCurrentUser should dispatch to notifications/addNotification', async () => {
      userService.getUserFormPreferences.mockRejectedValue('');
      await store.actions.getFormPreferencesForCurrentUser(mockStore, 'fId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('updateFormPreferencesForCurrentUser should commit to SET_USER_FORM_PREFERENCES', async () => {
      userService.updateUserFormPreferences.mockResolvedValue({
        data: {
          preferences: ['foo', 'bar'],
          userId: '123',
        },
      });
      await store.actions.updateFormPreferencesForCurrentUser(mockStore, { formId: 'fId', preferences: {} });

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_USER_FORM_PREFERENCES', expect.any(Object));
    });

    it('updateFormPreferencesForCurrentUser should dispatch to notifications/addNotification', async () => {
      userService.updateUserFormPreferences.mockRejectedValue('');
      await store.actions.updateFormPreferencesForCurrentUser(mockStore, { formId: 'fId', preferences: {} });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });
  });

  describe('form', () => {
    it('fetchForm should commit to SET_FORM', async () => {
      formService.readForm.mockResolvedValue({ data: { form: {} } });
      await store.actions.fetchForm(mockStore, { formId: 'fId' });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_API_KEY', expect.any(Object));
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM', expect.any(Object));
    });

    it('fetchForm should dispatch to notifications/addNotification', async () => {
      formService.readForm.mockRejectedValue('');
      await store.actions.fetchSubmission(mockStore, { formId: 'fId' });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('fetchFormFields should commit to SET_FORM_FIELDS', async () => {
      formService.readVersionFields.mockResolvedValue({ data: { form: {} } });
      await store.actions.fetchFormFields(mockStore, { formId: 'fId', formVersionId: 'vid' });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM_FIELDS', expect.any(Object));
    });

    it('fetchForm should dispatch to notifications/addNotification', async () => {
      formService.readVersionFields.mockRejectedValue('');
      await store.actions.fetchFormFields(mockStore, { formId: 'fId', formVersionId: 'vid' });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('fetchDrafts should commit to SET_DRAFTS', async () => {
      formService.listDrafts.mockResolvedValue({ data: [] });
      await store.actions.fetchDrafts(mockStore, 'dId');

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_DRAFTS', expect.any(Array));
    });

    it('fetchDrafts should dispatch to notifications/addNotification', async () => {
      formService.listDrafts.mockRejectedValue('');
      await store.actions.fetchDrafts(mockStore, 'dId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });
  });

  describe('submission', () => {
    it('deleteSubmission should commit to SET_FORMSUBMISSION', async () => {
      formService.deleteSubmission.mockResolvedValue({ data: { submission: {}, form: {} } });
      await store.actions.deleteSubmission(mockStore, 'sId');

      expect(formService.deleteSubmission).toHaveBeenCalledTimes(1);
      expect(formService.deleteSubmission).toHaveBeenCalledWith('sId');
    });

    it('deleteSubmission should dispatch to notifications/addNotification', async () => {
      formService.deleteSubmission.mockRejectedValue('');
      await store.actions.deleteSubmission(mockStore, 'sId');

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('deleteMultiSubmissions should dispatch to notifications/addNotification', async () => {
      formService.deleteMultipleSubmissions.mockRejectedValue('');
      await store.actions.deleteMultiSubmissions(mockStore, ['sId']);
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('restoreMultiSubmissions should dispatch to notifications/addNotification', async () => {
      formService.restoreMutipleSubmissions.mockRejectedValue('');
      await store.actions.restoreMultiSubmissions(mockStore, ['sId']);
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('fetchSubmission should commit to SET_FORMSUBMISSION', async () => {
      formService.getSubmission.mockResolvedValue({ data: { submission: {}, form: {} } });
      await store.actions.fetchSubmission(mockStore, { submissionId: 'sId' });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORMSUBMISSION', expect.any(Object));
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM', expect.any(Object));
    });

    it('fetchSubmission should dispatch to notifications/addNotification', async () => {
      formService.getSubmission.mockRejectedValue('');
      await store.actions.fetchSubmission(mockStore, { submissionId: 'sId' });

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('fetchSubmissions should commit to SET_SUBMISSIONLIST', async () => {
      formService.listSubmissions.mockResolvedValue({ data: [] });
      await store.actions.fetchSubmissions(mockStore, { formId: 'fId' });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_SUBMISSIONLIST', expect.any(Array));
      expect(formService.listSubmissions).toHaveBeenCalledTimes(1);
      expect(formService.listSubmissions).toHaveBeenCalledWith('fId', { deleted: false, createdBy: '' });
      expect(rbacService.getUserSubmissions).toHaveBeenCalledTimes(0);
    });

    it('fetchSubmissions should call the formService if not for userView', async () => {
      formService.listSubmissions.mockResolvedValue({ data: [] });
      await store.actions.fetchSubmissions(mockStore, { formId: 'fId', userView: false });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_SUBMISSIONLIST', expect.any(Array));
      expect(formService.listSubmissions).toHaveBeenCalledTimes(1);
      expect(formService.listSubmissions).toHaveBeenCalledWith('fId', { deleted: false, createdBy: '' });
      expect(rbacService.getUserSubmissions).toHaveBeenCalledTimes(0);
    });

    it('fetchSubmissions should call the rbacService if for userView', async () => {
      rbacService.getUserSubmissions.mockResolvedValue({ data: [] });
      await store.actions.fetchSubmissions(mockStore, { formId: 'fId', userView: true });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_SUBMISSIONLIST', expect.any(Array));
      expect(formService.listSubmissions).toHaveBeenCalledTimes(0);
      expect(rbacService.getUserSubmissions).toHaveBeenCalledTimes(1);
      expect(rbacService.getUserSubmissions).toHaveBeenCalledWith({ formId: 'fId' });
    });

    it('fetchSubmissions should dispatch to notifications/addNotification', async () => {
      formService.listSubmissions.mockRejectedValue('');
      await store.actions.fetchSubmissions(mockStore, { formId: 'fId' });

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_SUBMISSIONLIST', expect.any(Array));
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
      expect(formService.listSubmissions).toHaveBeenCalledTimes(1);
      expect(formService.listSubmissions).toHaveBeenCalledWith('fId', { deleted: false, createdBy: '' });
      expect(rbacService.getUserSubmissions).toHaveBeenCalledTimes(0);
    });

    it('fetchVersion should commit to SET_FORMSUBMISSION and SET_VERSION', async () => {
      formService.readVersion.mockResolvedValue({ data: [] });
      await store.actions.fetchVersion(mockStore, { formId: 'fId', versionId: 'vId' });

      expect(mockStore.commit).toHaveBeenCalledTimes(2);
      expect(mockStore.commit).toHaveBeenNthCalledWith(1, 'SET_FORMSUBMISSION', expect.any(Object));
      expect(mockStore.commit).toHaveBeenNthCalledWith(2, 'SET_VERSION', expect.any(Object));
    });

    it('fetchVersion should dispatch to notifications/addNotification', async () => {
      formService.readVersion.mockRejectedValue('');
      await store.actions.fetchVersion(mockStore, { formId: 'fId', versionId: 'vId' });

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FORMSUBMISSION', expect.any(Object));
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });
  });
  describe('form components proactive help', () => {
    it('listFCProactiveHelp should commit to SET_FCPROACTIVEHELPGROUPLIST', async () => {
      adminService.listFCProactiveHelp.mockResolvedValue({ data: [] });
      await store.actions.listFCProactiveHelp(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FCPROACTIVEHELPGROUPLIST', expect.any(Object));
    });

    it('listFCProactiveHelp should dispatch to notifications/addNotification', async () => {
      adminService.listFCProactiveHelp.mockRejectedValue('');
      await store.actions.listFCProactiveHelp(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FCPROACTIVEHELPGROUPLIST', expect.any(Object));
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });

    it('getFCProactiveHelpImageUrl should commit to SET_FCPROACTIVEHELPIMAGEURL', async () => {
      adminService.getFCProactiveHelpImageUrl.mockResolvedValue({ data: {} });
      await store.actions.getFCProactiveHelpImageUrl(mockStore);
      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FCPROACTIVEHELPIMAGEURL', expect.any(Object));
    });

    it('getFCProactiveHelpImageUrl should dispatch to notifications/addNotification', async () => {
      adminService.getFCProactiveHelpImageUrl.mockRejectedValue('');
      await store.actions.getFCProactiveHelpImageUrl(mockStore);

      expect(mockStore.commit).toHaveBeenCalledTimes(1);
      expect(mockStore.commit).toHaveBeenCalledWith('SET_FCPROACTIVEHELPIMAGEURL', expect.any(Object));
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    });
  });
  it('fetchFormCSVExportFields should commit to SET_FORM_FIELDS', async () => {
    formService.readCSVExportFields.mockRejectedValue('');
    await store.actions.fetchFormCSVExportFields(mockStore, {
      formId: 'bd4dcf26-65bd-429b-967f-125500bfd8a4',
      type: false,
      draft: false,
      deleted: false,
      version: 2,
    });

    expect(mockStore.commit).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledWith('SET_FORM_FIELDS', expect.any(Object));
    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
    expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
    expect(mockStore.dispatch).toHaveBeenCalledWith('notifications/addNotification', expect.any(Object), expect.any(Object));
  });
});
