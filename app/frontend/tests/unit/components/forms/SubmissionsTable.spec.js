import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { FormRoleCodes } from '~/utils/constants';

describe('SubmissionsTable.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
  });

  it('renders', () => {
    const getFormRolesForUserSpy = vi.spyOn(formStore, 'getFormRolesForUser');
    getFormRolesForUserSpy.mockImplementation(() => {
      formStore.roles = [
        FormRoleCodes.FORM_DESIGNER,
        FormRoleCodes.FORM_SUBMITTER,
        FormRoleCodes.OWNER,
        FormRoleCodes.SUBMISSION_APPROVER,
        FormRoleCodes.SUBMISSION_REVIEWER,
        FormRoleCodes.TEAM_MANAGER,
      ];
    });
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    getFormPermissionsForUserSpy.mockImplementation(() => {
      formStore.permissions = [
        'design_create',
        'design_delete',
        'design_read',
        'design_update',
        'document_template_create',
        'document_template_delete',
        'document_template_read',
        'email_template_read',
        'email_template_update',
        'form_api_create',
        'form_api_delete',
        'form_api_read',
        'form_api_update',
        'form_delete',
        'form_read',
        'form_update',
        'submission_create',
        'submission_delete',
        'submission_read',
        'submission_review',
        'submission_update',
        'team_read',
        'team_update',
      ];
    });
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockImplementation(() => {
      formStore.form = {
        id: '12345678-1234-1234-1234-123456789012',
        name: 'Test form',
        description: '',
        active: true,
        labels: [],
        createdBy: 'TEST@idir',
        createdAt: '2024-05-09T18:34:15.078Z',
        updatedBy: 'TEST@idir',
        updatedAt: '2024-05-22T07:14:19.575Z',
        showSubmissionConfirmation: true,
        submissionReceivedEmails: [],
        enableStatusUpdates: true,
        enableSubmitterDraft: true,
        schedule: {
          enabled: null,
          scheduleType: null,
          openSubmissionDateTime: null,
          keepOpenForTerm: null,
          keepOpenForInterval: null,
          closingMessageEnabled: null,
          closingMessage: null,
          closeSubmissionDateTime: null,
          repeatSubmission: {
            enabled: null,
            repeatUntil: null,
            everyTerm: null,
            everyIntervalType: null,
          },
          allowLateSubmissions: {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          },
        },
        reminder_enabled: false,
        enableCopyExistingSubmission: true,
        allowSubmitterToUploadFile: true,
        subscribe: {
          enabled: null,
        },
        deploymentLevel: 'development',
        ministry: 'CITZ',
        apiIntegration: true,
        useCase: 'application',
        sendSubmissionReceivedEmail: false,
        wideFormLayout: true,
        enableDocumentTemplates: false,
        identityProviders: [],
        versions: [
          {
            id: '12345678-1234-1234-1234-123456789013',
            formId: '12345678-1234-1234-1234-123456789012',
            version: 3,
            published: true,
            createdBy: 'TEST@idir',
            createdAt: '2024-05-30T20:40:13.491Z',
            updatedBy: 'TEST@idir',
            updatedAt: '2024-06-04T21:08:01.524Z',
          },
          {
            id: '12345678-1234-1234-1234-123456789014',
            formId: '12345678-1234-1234-1234-123456789012',
            version: 2,
            published: false,
            createdBy: 'TEST@idir',
            createdAt: '2024-05-09T18:40:06.755Z',
            updatedBy: 'TEST@idir',
            updatedAt: '2024-06-04T19:36:52.131Z',
          },
          {
            id: '12345678-1234-1234-1234-123456789015',
            formId: '12345678-1234-1234-1234-123456789012',
            version: 1,
            published: false,
            createdBy: 'TEST@idir',
            createdAt: '2024-05-09T18:34:22.931Z',
            updatedBy: 'TEST@idir',
            updatedAt: '2024-06-04T19:36:52.131Z',
          },
        ],
        snake: 'test-form',
        idps: [],
        userType: 'team',
      };
      return Promise.resolve();
    });
    const fetchFormFieldsSpy = vi.spyOn(formStore, 'fetchFormFields');
    fetchFormFieldsSpy.mockImplementation(() => {
      formStore.formFields = ['firstName'];
    });

    const wrapper = mount(SubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toContain('trans.formsTable.submissions');
  });
});
