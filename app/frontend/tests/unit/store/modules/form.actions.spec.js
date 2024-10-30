import { setActivePinia, createPinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formService,
  rbacService,
  userService,
  adminService,
} from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

vi.mock('~/services');

describe('form actions', () => {
  setActivePinia(createPinia());
  const mockStore = useFormStore();
  const appStore = useAppStore();
  const notificationStore = useNotificationStore();
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const listSubmissionsSpy = vi.spyOn(formService, 'listSubmissions');
  const getUserSubmissionsSpy = vi.spyOn(rbacService, 'getUserSubmissions');
  const mockConsoleError = vi.spyOn(console, 'error');

  beforeEach(() => {
    mockStore.$reset();
    mockConsoleError.mockReset();
    appStore.$reset();
    notificationStore.$reset();
    addNotificationSpy.mockReset();
    listSubmissionsSpy.mockReset();
    getUserSubmissionsSpy.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    addNotificationSpy.mockRestore();
    listSubmissionsSpy.mockRestore();
    getUserSubmissionsSpy.mockRestore();
  });

  describe('current user', () => {
    it('getFormsForCurrentUser should commit to SET_FORMLIST', async () => {
      rbacService.getCurrentUser.mockResolvedValue({ data: { forms: [] } });
      await mockStore.getFormsForCurrentUser();

      expect(mockStore.formList).toEqual(expect.any(Array));
    });

    it('getFormsForCurrentUser should dispatch to notifications/addNotification', async () => {
      rbacService.getCurrentUser.mockRejectedValue('');
      await mockStore.getFormsForCurrentUser();

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
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
      mockStore.permissions = undefined;
      await mockStore.getFormPermissionsForUser('fId');

      expect(mockStore.permissions).toEqual(expect.any(Array));
    });

    it('getFormPermissionsForUser should dispatch to notifications/addNotification', async () => {
      rbacService.getCurrentUser.mockResolvedValue({ data: { forms: [] } });
      mockStore.permissions = undefined;
      await mockStore.getFormPermissionsForUser('fId');

      expect(mockStore.permissions).toEqual([]);
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('getFormPreferencesForCurrentUser should commit to SET_USER_FORM_PREFERENCES', async () => {
      userService.getUserFormPreferences.mockResolvedValue({
        data: {
          preferences: ['foo', 'bar'],
          userId: '123',
        },
      });
      mockStore.userFormPreferences = undefined;
      await mockStore.getFormPreferencesForCurrentUser('fId');

      expect(mockStore.userFormPreferences).toEqual(expect.any(Object));
    });

    it('getFormPreferencesForCurrentUser should dispatch to notifications/addNotification', async () => {
      userService.getUserFormPreferences.mockRejectedValue('');
      await mockStore.getFormPreferencesForCurrentUser('fId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('updateFormPreferencesForCurrentUser should commit to SET_USER_FORM_PREFERENCES', async () => {
      userService.updateUserFormPreferences.mockResolvedValue({
        data: {
          preferences: ['foo', 'bar'],
          userId: '123',
        },
      });
      mockStore.userFormPreferences = undefined;
      await mockStore.updateFormPreferencesForCurrentUser({
        formId: 'fId',
        preferences: {},
      });

      expect(mockStore.userFormPreferences).toEqual(expect.any(Object));
    });

    it('updateFormPreferencesForCurrentUser should dispatch to notifications/addNotification', async () => {
      userService.updateUserFormPreferences.mockRejectedValue('');
      await mockStore.updateFormPreferencesForCurrentUser({
        formId: 'fId',
        preferences: {},
      });

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('form', () => {
    it('fetchForm should commit to SET_FORM', async () => {
      formService.readForm.mockResolvedValue({ data: { form: {} } });
      mockStore.apiKey = undefined;
      mockStore.form = undefined;
      await mockStore.fetchForm({ formId: 'fId' });

      expect(mockStore.apiKey).toEqual(null);
      expect(mockStore.form).toEqual(expect.any(Object));
    });

    it('fetchForm should dispatch to notifications/addNotification', async () => {
      formService.readForm.mockRejectedValue('');
      await mockStore.fetchSubmission({ formId: 'fId' });

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('fetchFormFields should commit to SET_FORM_FIELDS', async () => {
      formService.readVersionFields.mockResolvedValue({ data: { form: {} } });
      mockStore.formFields = undefined;
      await mockStore.fetchFormFields({
        formId: 'fId',
        formVersionId: 'vid',
      });

      expect(mockStore.formFields).toEqual(expect.any(Object));
    });

    it('fetchForm should dispatch to notifications/addNotification', async () => {
      formService.readVersionFields.mockRejectedValue('');
      await mockStore.fetchFormFields({
        formId: 'fId',
        formVersionId: 'vid',
      });

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('fetchDrafts should commit to SET_DRAFTS', async () => {
      formService.listDrafts.mockResolvedValue({ data: [] });
      mockStore.drafts = undefined;
      await mockStore.fetchDrafts('dId');

      expect(mockStore.drafts).toEqual(expect.any(Array));
    });

    it('fetchDrafts should dispatch to notifications/addNotification', async () => {
      formService.listDrafts.mockRejectedValue('');
      await mockStore.fetchDrafts('dId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('emailTemplates', () => {
    it('fetchEmailTemplates should commit to SET_EMAIL_TEMPLATES', async () => {
      mockStore.emailTemplates = undefined;
      formService.listEmailTemplates.mockResolvedValue({ data: [] });
      await mockStore.fetchEmailTemplates(mockStore, 'dId');

      expect(mockStore.emailTemplates).toEqual(expect.any(Array));
    });

    it('fetchEmailTemplates should dispatch to notifications/addNotification', async () => {
      mockStore.emailTemplates = undefined;
      formService.listEmailTemplates.mockRejectedValue('');
      await mockStore.fetchEmailTemplates(mockStore, 'dId');

      expect(mockStore.emailTemplates).toBe(expect.undefined);
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('updateEmailTemplate should call the form service update', async () => {
      formService.updateEmailTemplate.mockResolvedValue({ data: [] });
      const data = {
        body: 'sample email body',
        subject: 'sample email subject',
        title: 'sample email title',
        type: 'submissionConfirmation',
      };

      await mockStore.updateEmailTemplate(mockStore, data);

      expect(formService.updateEmailTemplate).toHaveBeenCalledTimes(1);
      expect(formService.updateEmailTemplate).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('updateEmailTemplate should dispatch to notifications/addNotification', async () => {
      formService.updateEmailTemplate.mockRejectedValue('');
      await mockStore.updateEmailTemplate(mockStore, 'dId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('submission', () => {
    it('deleteSubmission should commit to SET_FORMSUBMISSION', async () => {
      formService.deleteSubmission.mockResolvedValue({
        data: { submission: {}, form: {} },
      });
      await mockStore.deleteSubmission('sId');

      expect(formService.deleteSubmission).toHaveBeenCalledTimes(1);
      expect(formService.deleteSubmission).toHaveBeenCalledWith('sId');
    });

    it('deleteSubmission should dispatch to notifications/addNotification', async () => {
      formService.deleteSubmission.mockRejectedValue('');
      await mockStore.deleteSubmission('sId');

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('deleteMultiSubmissions should dispatch to notifications/addNotification', async () => {
      formService.deleteMultipleSubmissions.mockRejectedValue('');
      await mockStore.deleteMultiSubmissions(['sId']);

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('restoreMultiSubmissions should dispatch to notifications/addNotification', async () => {
      formService.restoreMultipleSubmissions.mockRejectedValue('');
      await mockStore.restoreMultiSubmissions(['sId']);

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('fetchSubmission should commit to SET_FORMSUBMISSION', async () => {
      formService.getSubmission.mockResolvedValue({
        data: { submission: {}, form: {} },
      });
      mockStore.formSubmission = undefined;
      mockStore.form = undefined;
      await mockStore.fetchSubmission({ submissionId: 'sId' });

      expect(mockStore.formSubmission).toEqual(expect.any(Object));
      expect(mockStore.form).toEqual(expect.any(Object));
    });

    it('fetchSubmission should dispatch to notifications/addNotification', async () => {
      formService.getSubmission.mockRejectedValue('');
      await mockStore.fetchSubmission({ submissionId: 'sId' });

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('fetchSubmissions should commit to SET_SUBMISSIONLIST', async () => {
      formService.listSubmissions.mockResolvedValue({
        data: [],
      });
      await mockStore.fetchSubmissions({ formId: 'fId' });

      expect(mockStore.submissionList).toEqual([]);
      expect(listSubmissionsSpy).toHaveBeenCalledTimes(1);
      expect(listSubmissionsSpy).toHaveBeenCalledWith('fId', {
        createdAt: undefined,
        deleted: false,
        createdBy: '',
        fields: undefined,
        filterformSubmissionStatusCode: undefined,
        itemsPerPage: undefined,
        page: undefined,
        sortBy: undefined,
        totalSubmissions: 0,
      });
      expect(getUserSubmissionsSpy).toHaveBeenCalledTimes(0);
    });

    it('fetchSubmissions should call the formService if not for userView', async () => {
      formService.listSubmissions.mockResolvedValue({
        data: [],
      });
      await mockStore.fetchSubmissions({
        formId: 'fId',
        userView: false,
      });

      expect(mockStore.submissionList).toEqual([]);
      expect(listSubmissionsSpy).toHaveBeenCalledTimes(1);
      expect(listSubmissionsSpy).toHaveBeenCalledWith('fId', {
        createdAt: undefined,
        deleted: false,
        createdBy: '',
        fields: undefined,
        filterformSubmissionStatusCode: undefined,
        itemsPerPage: undefined,
        page: undefined,
        sortBy: undefined,
        totalSubmissions: 0,
      });
      expect(getUserSubmissionsSpy).toHaveBeenCalledTimes(0);
    });

    it('fetchSubmissions should call the rbacService if for userView', async () => {
      rbacService.getUserSubmissions.mockResolvedValue({
        data: [],
      });
      await mockStore.fetchSubmissions({
        formId: 'fId',
        userView: true,
      });
      expect(mockStore.submissionList).toEqual([]);
      expect(listSubmissionsSpy).toHaveBeenCalledTimes(0);
      expect(getUserSubmissionsSpy).toHaveBeenCalledTimes(1);
      expect(getUserSubmissionsSpy).toHaveBeenCalledWith({
        formId: 'fId',
      });
    });

    it('fetchSubmissions should dispatch to notifications/addNotification', async () => {
      formService.listSubmissions.mockRejectedValue('');
      mockStore.submissionList = undefined;
      await mockStore.fetchSubmissions({ formId: 'fId' });

      expect(mockStore.submissionList).toEqual([]);
      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(listSubmissionsSpy).toHaveBeenCalledTimes(1);
      expect(listSubmissionsSpy).toHaveBeenCalledWith('fId', {
        createdAt: undefined,
        deleted: false,
        createdBy: '',
        fields: undefined,
        filterformSubmissionStatusCode: undefined,
        itemsPerPage: undefined,
        page: undefined,
        sortBy: undefined,
        totalSubmissions: 0,
      });
      expect(getUserSubmissionsSpy).toHaveBeenCalledTimes(0);
    });

    it('fetchVersion should commit to SET_FORMSUBMISSION and SET_VERSION', async () => {
      formService.readVersion.mockResolvedValue({ data: [] });
      mockStore.formSubmission = undefined;
      mockStore.version = undefined;
      await mockStore.fetchVersion({
        formId: 'fId',
        versionId: 'vId',
      });
      expect(mockStore.formSubmission).toEqual(expect.any(Object));
      expect(mockStore.version).toEqual(expect.any(Object));
    });

    it('fetchVersion should dispatch to notifications/addNotification', async () => {
      formService.readVersion.mockRejectedValue('');
      mockStore.version = undefined;
      await mockStore.fetchVersion({
        formId: 'fId',
        versionId: 'vId',
      });

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });
  describe('form components proactive help', () => {
    it('listFCProactiveHelp should commit to SET_FCPROACTIVEHELPGROUPLIST', async () => {
      adminService.listFCProactiveHelp.mockResolvedValue({ data: [] });
      await mockStore.listFCProactiveHelp();

      expect(mockStore.fcProactiveHelpGroupList).toEqual(expect.any(Object));
    });

    it('listFCProactiveHelp should dispatch to notifications/addNotification', async () => {
      adminService.listFCProactiveHelp.mockRejectedValue('');
      await mockStore.listFCProactiveHelp();

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('getFCProactiveHelpImageUrl should commit to SET_FCPROACTIVEHELPIMAGEURL', async () => {
      adminService.getFCProactiveHelpImageUrl.mockResolvedValue({ data: {} });
      await mockStore.getFCProactiveHelpImageUrl();
      expect(mockStore.fcProactiveHelpImageUrl).toEqual(expect.any(Object));
    });

    it('getFCProactiveHelpImageUrl should dispatch to notifications/addNotification', async () => {
      adminService.getFCProactiveHelpImageUrl.mockRejectedValue('');
      await mockStore.getFCProactiveHelpImageUrl();

      expect(addNotificationSpy).toHaveBeenCalledTimes(1);
      expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });
  it('fetchFormCSVExportFields should commit to SET_FORM_FIELDS', async () => {
    formService.readCSVExportFields.mockRejectedValue([]);
    mockStore.formFields = undefined;
    await mockStore.fetchFormCSVExportFields({
      formId: 'bd4dcf26-65bd-429b-967f-125500bfd8a4',
      type: false,
      draft: false,
      deleted: false,
      version: 2,
    });

    expect(mockStore.formFields).toEqual(expect.any(Array));

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledWith(expect.any(Object));
  });
});
