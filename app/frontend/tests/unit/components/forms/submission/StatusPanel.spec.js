import { createTestingPinia } from '@pinia/testing';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, vi } from 'vitest';
import { ref } from 'vue';

import StatusPanel from '~/components/forms/submission/StatusPanel.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { formService } from '~/services';
import { rbacService } from '~/services';

const FORM_ID = 'formId';
const SUBMISSION_ID = 'submissionId';
const USER_ID = 'userId';

const STUBS = {
  VSkeletonLoader: {
    name: 'v-skeleton-loader',
    template: '<div class="v-skeleton-loader-stub"><slot /></div>',
  },
  VTooltip: {
    name: 'v-tooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VForm: {
    name: 'v-form',
    template: '<div class="v-form-stub"><slot /></div>',
  },
  VSelect: {
    name: 'v-select',
    template: '<div class="v-select-stub"><slot /></div>',
  },
  VAutocomplete: {
    name: 'v-autocomplete',
    template: '<div class="v-autocomplete-stub"><slot /></div>',
  },
  VBtn: {
    name: 'v-btn',
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VIcon: {
    name: 'v-icon',
    template: '<div class="v-icon-stub"><slot /></div>',
  },
};

describe('StatusPanel', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);

  const addNotificationSpy = vi
    .spyOn(notificationStore, 'addNotification')
    .mockImplementation(() => {});
  const getFormUsersSpy = vi.spyOn(rbacService, 'getFormUsers');
  const getStatusCodesSpy = vi.spyOn(formService, 'getStatusCodes');

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
    notificationStore.$reset();

    addNotificationSpy.mockReset();
    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
  });

  it('renders', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.showStatusContent = true;

    await flushPromises();

    expect(getFormUsersSpy).toBeCalledTimes(1);
    expect(getStatusCodesSpy).toBeCalledTimes(1);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
    expect(wrapper.html()).toContain('trans.formSubmission.status');
    expect(wrapper.html()).toContain('trans.statusPanel.currentStatus');
    expect(wrapper.html()).toContain('trans.statusPanel.assignedTo');
    expect(wrapper.html()).toContain('trans.statusPanel.assignOrUpdateStatus');
    expect(wrapper.html()).toContain('trans.statusPanel.statusIsRequired');
  });

  it('statusAction returns different values based on the statusToSet', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.statusToSet = 'ASSIGNED';
    expect(wrapper.vm.statusAction).toEqual('trans.statusPanel.assign');
    wrapper.vm.statusToSet = 'COMPLETED';
    expect(wrapper.vm.statusAction).toEqual('trans.statusPanel.complete');
    wrapper.vm.statusToSet = 'REVISING';
    expect(wrapper.vm.statusAction).toEqual('trans.statusPanel.revise');
    wrapper.vm.statusToSet = 'UPDATE';
    expect(wrapper.vm.statusAction).toEqual('trans.statusPanel.update');
  });

  it('onStatusChange will fetchSubmissionUsers and update submissionUserEmail and showSendConfirmEmail if the status is revising or completed', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const fetchSubmissionUsersSpy = vi.spyOn(formStore, 'fetchSubmissionUsers');
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.onStatusChange('TEST');
    // nothing happens
    expect(fetchSubmissionUsersSpy).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);

    fetchSubmissionUsersSpy.mockReset();
    addNotificationSpy.mockReset();

    formStore.formSubmission = {
      createdBy: 'TEST@idir',
    };
    fetchSubmissionUsersSpy.mockImplementationOnce(() => {
      formStore.submissionUsers = {
        data: [
          {
            user: {
              idpCode: 'idir',
              username: 'TEST',
              email: 'email@email.com',
            },
          },
        ],
      };
    });
    // Revising means don't showSendConfirmEmail
    await wrapper.vm.onStatusChange('REVISING');
    expect(fetchSubmissionUsersSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
    // if there is an idp code then the username is the username@idpCode otherwise it's just the username
    expect(wrapper.vm.submissionUserEmail).toEqual('email@email.com');
    expect(wrapper.vm.showSendConfirmEmail).toBeFalsy();

    fetchSubmissionUsersSpy.mockReset();
    addNotificationSpy.mockReset();

    const getEmailRecipientsSpy = vi.spyOn(formService, 'getEmailRecipients');

    formStore.formSubmission = {
      createdBy: 'TEST@bceid-basic',
    };
    fetchSubmissionUsersSpy.mockImplementationOnce(() => {
      formStore.submissionUsers = {
        data: [
          {
            user: {
              username: 'TEST@bceid-basic',
              email: 'email@email.com',
            },
          },
        ],
      };
    });
    getEmailRecipientsSpy.mockResolvedValue({
      data: { emailRecipients: ['email@email.com'] },
    })
    // Revising means don't showSendConfirmEmail
    await wrapper.vm.onStatusChange('COMPLETED');
    expect(fetchSubmissionUsersSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
    // if there is an idp code then the username is the username@idpCode otherwise it's just the username
    expect(wrapper.vm.submissionUserEmail).toEqual('email@email.com');
    expect(wrapper.vm.showSendConfirmEmail).toBeTruthy();

    fetchSubmissionUsersSpy.mockReset();
    addNotificationSpy.mockReset();
    wrapper.vm.submissionUserEmail = '';
    wrapper.vm.showSendConfirmEmail = false;

    formStore.formSubmission = {
      createdBy: 'TEST@bceid-basic',
    };
    fetchSubmissionUsersSpy.mockImplementationOnce(() => {
      throw Error();
    });
    await wrapper.vm.onStatusChange('COMPLETED');
    expect(fetchSubmissionUsersSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.submissionUserEmail).toEqual('');
    expect(wrapper.vm.showSendConfirmEmail).toBeFalsy();

    fetchSubmissionUsersSpy.mockReset();
    addNotificationSpy.mockReset();
  });

  it('assignToCurrentUser will set assignee value to the formReviewers user where the idpUserId matches', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.showStatusContent = true;

    await flushPromises();

    expect(wrapper.vm.formReviewers).toEqual([]);
    expect(wrapper.vm.assignee).toEqual(null);
    // default user
    expect(authStore.user).toEqual({
      email: '',
      firstName: '',
      fullName: '',
      idp: {
        code: 'public',
        display: 'Public',
        hint: 'public',
      },
      idpUserId: '',
      lastName: '',
      public: true,
      username: '',
    });

    authStore.user = {
      idpUserId: USER_ID,
    };
    wrapper.vm.formReviewers = [
      {
        idpUserId: USER_ID,
      },
    ];
    wrapper.vm.assignToCurrentUser();
    expect(wrapper.vm.assignee).toEqual({
      idpUserId: USER_ID,
    });
  });

  it('autoCompleteFilter will return the fullName or username if it is in the queryText', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.showStatusContent = true;

    await flushPromises();

    expect(
      wrapper.vm.autoCompleteFilter(
        '',
        'test',
        ref({
          fullName: 'TEST LASTNAME',
          username: 'MY_USERNAME',
        })
      )
    ).toBeTruthy();

    expect(
      wrapper.vm.autoCompleteFilter(
        '',
        'test',
        ref({
          fullName: 'FIRSTNAME LASTNAME',
          username: 'TEST_USERNAME',
        })
      )
    ).toBeTruthy();

    expect(
      wrapper.vm.autoCompleteFilter(
        '',
        'test',
        ref({
          fullName: 'FIRSTNAME LASTNAME',
          username: 'MY_USERNAME',
        })
      )
    ).toBeFalsy();
  });

  it('revisingFilter will return the fullName or username if it is in the queryText', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.showStatusContent = true;

    await flushPromises();

    expect(
      wrapper.vm.revisingFilter(
        '',
        'test',
        {
          value: 'TEST LASTNAME',
          title: 'MY_USERNAME',
        }
      )
    ).toBeTruthy();

    expect(
      wrapper.vm.revisingFilter(
        '',
        'test',
        {
          value: 'FIRSTNAME LASTNAME',
          title: 'TEST_USERNAME',
        }
      )
    ).toBeTruthy();

    expect(
      wrapper.vm.revisingFilter(
        '',
        'test',
        {
          value: 'FIRSTNAME LASTNAME',
          title: 'MY_USERNAME',
        }
      )
    ).toBeFalsy();
  });

  it('getStatus will throw an error if there is no statusHistory', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            fullName: 'firstname lastname',
          },
          {
            fullName: 'z y',
          },
          {
            fullName: 'a b',
          },
        ],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });

    shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(getFormUsersSpy).toBeCalledTimes(1);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(getStatusCodesSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('getStatus will throw an error if there are no status codes', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            fullName: 'firstname lastname',
          },
          {
            fullName: 'z y',
          },
          {
            fullName: 'a b',
          },
        ],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });

    shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(getFormUsersSpy).toBeCalledTimes(1);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(getStatusCodesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('resetForm resets most values', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
    };

    await flushPromises();

    expect(wrapper.vm.addComment).toBeFalsy();
    expect(wrapper.vm.emailComment).toEqual('');
    expect(wrapper.vm.statusFields).toBeFalsy();
    expect(wrapper.vm.submissionUserEmail).toEqual('');
    expect(wrapper.vm.statusToSet).toEqual('');
    expect(wrapper.vm.note).toEqual('');

    wrapper.vm.resetForm();

    expect(wrapper.vm.addComment).toBeFalsy();
    expect(wrapper.vm.emailComment).toEqual('');
    expect(wrapper.vm.statusFields).toBeFalsy();
    expect(wrapper.vm.submissionUserEmail).toEqual('');
    expect(wrapper.vm.statusToSet).toEqual('');
    expect(wrapper.vm.note).toEqual('');
  });

  it('updateStatus will run through successfully', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
      validate: vi.fn().mockImplementationOnce(() => true),
    };

    await flushPromises();

    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
    getSubmissionStatusesSpy.mockReset();
    addNotificationSpy.mockReset();

    wrapper.vm.assignee = {
      email: 'test@test.com',
      userId: USER_ID,
    };
    wrapper.vm.emailComment = 'Hello World';
    wrapper.vm.statusToSet = 'ASSIGNED';

    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });

    const updateSubmissionStatusSpy = vi.spyOn(
      formService,
      'updateSubmissionStatus'
    );
    updateSubmissionStatusSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            submissionStatusId: '1',
          },
        ],
      };
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementationOnce(() => {
      return {
        data: {
          id: USER_ID,
        },
      };
    });
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(() => {
      return {
        data: {},
      };
    });

    const getEmailRecipientsSpy = vi.spyOn(formService, 'getEmailRecipients');
    getEmailRecipientsSpy.mockResolvedValue({
      data: { emailRecipients: ['email@email.com'] },
    });

    await wrapper.vm.updateStatus();

    expect(updateSubmissionStatusSpy).toBeCalledTimes(1);
    expect(getCurrentUserSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledTimes(1);
    expect(getFormUsersSpy).toBeCalledTimes(1);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(getStatusCodesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });
  
  it('updateStatus will run through successfully with multiple emails', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(formService, 'getSubmissionStatuses');
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });
  
    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
      validate: vi.fn().mockImplementationOnce(() => true),
    };
  
    await flushPromises();
  
    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
    getSubmissionStatusesSpy.mockReset();
    addNotificationSpy.mockReset();
  
    wrapper.vm.assignee = {
      email: 'test@test.com',
      userId: USER_ID,
    };
    wrapper.vm.emailComment = 'Hello World';
    wrapper.vm.statusToSet = 'REVISING';
    wrapper.vm.selectedSubmissionUsers = ['email1@email.com', 'email2@email.com'];
  
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
  
    const updateSubmissionStatusSpy = vi.spyOn(formService, 'updateSubmissionStatus');
    updateSubmissionStatusSpy.mockImplementation(() => {
      return {
        data: [
          {
            submissionStatusId: '1',
          },
        ],
      };
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementation(() => {
      return {
        data: {
          id: USER_ID,
        },
      };
    });
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementation(() => {
      return {
        data: {},
      };
    });

    const addEmailRecipientsSpy = vi.spyOn(formService, 'addEmailRecipients');
    addEmailRecipientsSpy.mockImplementationOnce(() => {
      return {};
    });

    const getEmailRecipientsSpy = vi.spyOn(formService, 'getEmailRecipients');
    getEmailRecipientsSpy.mockResolvedValue({
      data: { emailRecipients: ['email1@email.com', 'email2@email.com'] },
    });
  
    await wrapper.vm.updateStatus();
  
    expect(updateSubmissionStatusSpy).toBeCalledTimes(1);
    expect(getCurrentUserSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledTimes(1);
    expect(getFormUsersSpy).toBeCalledTimes(1);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(getStatusCodesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });
  
  
  it('updateStatus will run through successfully when status is COMPLETED', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
      validate: vi.fn().mockImplementationOnce(() => true),
    };

    await flushPromises();

    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
    getSubmissionStatusesSpy.mockReset();
    addNotificationSpy.mockReset();

    wrapper.vm.assignee = {
      email: 'test@test.com',
      userId: USER_ID,
    };
    wrapper.vm.emailComment = 'Hello World';
    wrapper.vm.statusToSet = 'COMPLETED';

    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });

    const updateSubmissionStatusSpy = vi.spyOn(
      formService,
      'updateSubmissionStatus'
    );
    updateSubmissionStatusSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            submissionStatusId: '1',
          },
        ],
      };
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementationOnce(() => {
      return {
        data: {
          id: USER_ID,
        },
      };
    });
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(() => {
      return {
        data: {},
      };
    });

    const getEmailRecipientsSpy = vi.spyOn(formService, 'getEmailRecipients');
    getEmailRecipientsSpy.mockResolvedValue({
      data: { emailRecipients: ['email@email.com'] },
    });

    await wrapper.vm.updateStatus();

    expect(updateSubmissionStatusSpy).toBeCalledTimes(1);
    expect(getCurrentUserSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledTimes(1);
    expect(getFormUsersSpy).toBeCalledTimes(1);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(1);
    expect(getStatusCodesSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('updateStatus will throw an error if there is no status to set', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
      validate: vi.fn().mockImplementationOnce(() => true),
    };

    await flushPromises();

    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
    getSubmissionStatusesSpy.mockReset();
    addNotificationSpy.mockReset();

    wrapper.vm.assignee = {
      email: 'test@test.com',
    };
    wrapper.vm.emailComment = 'Hello World';

    getFormUsersSpy.mockImplementationOnce(() => {});
    getStatusCodesSpy.mockImplementationOnce(() => {});
    getSubmissionStatusesSpy.mockImplementationOnce(() => {});

    const updateSubmissionStatusSpy = vi.spyOn(
      formService,
      'updateSubmissionStatus'
    );
    updateSubmissionStatusSpy.mockImplementationOnce(() => {});
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementationOnce(() => {});
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(() => {});

    await wrapper.vm.updateStatus();

    expect(updateSubmissionStatusSpy).toBeCalledTimes(0);
    expect(getCurrentUserSpy).toBeCalledTimes(0);
    expect(addNoteSpy).toBeCalledTimes(0);
    expect(getFormUsersSpy).toBeCalledTimes(0);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(0);
    expect(getStatusCodesSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('updateStatus will throw an error if there is data when updating submission status', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
      validate: vi.fn().mockImplementationOnce(() => true),
    };

    await flushPromises();

    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
    getSubmissionStatusesSpy.mockReset();
    addNotificationSpy.mockReset();

    wrapper.vm.assignee = {
      email: 'test@test.com',
    };
    wrapper.vm.statusToSet = 'ASSIGNED';
    wrapper.vm.emailComment = 'Hello World';

    getFormUsersSpy.mockImplementationOnce(() => {});
    getStatusCodesSpy.mockImplementationOnce(() => {});
    getSubmissionStatusesSpy.mockImplementationOnce(() => {});

    const updateSubmissionStatusSpy = vi.spyOn(
      formService,
      'updateSubmissionStatus'
    );
    updateSubmissionStatusSpy.mockImplementationOnce(() => {
      return {};
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementationOnce(() => {});
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(() => {});

    await wrapper.vm.updateStatus();

    expect(updateSubmissionStatusSpy).toBeCalledTimes(1);
    expect(getCurrentUserSpy).toBeCalledTimes(0);
    expect(addNoteSpy).toBeCalledTimes(0);
    expect(getFormUsersSpy).toBeCalledTimes(0);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(0);
    expect(getStatusCodesSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('updateStatus will throw an error if there is data when adding note', async () => {
    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    const getSubmissionStatusesSpy = vi.spyOn(
      formService,
      'getSubmissionStatuses'
    );
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });
    const wrapper = shallowMount(StatusPanel, {
      props: {
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.statusPanelForm = {
      resetValidation: vi.fn(),
      validate: vi.fn().mockImplementationOnce(() => true),
    };

    await flushPromises();

    getFormUsersSpy.mockReset();
    getStatusCodesSpy.mockReset();
    getSubmissionStatusesSpy.mockReset();
    addNotificationSpy.mockReset();
    wrapper.vm.assignee = {
      email: 'test@test.com',
      userId: USER_ID,
    };
    wrapper.vm.emailComment = 'Hello World';
    wrapper.vm.statusToSet = 'REVISING';

    getFormUsersSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    getStatusCodesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            statusCode: {
              code: 'SUBMITTED',
              display: 'Submitted',
              nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'],
            },
          },
        ],
      };
    });
    getSubmissionStatusesSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
          },
        ],
      };
    });

    const updateSubmissionStatusSpy = vi.spyOn(
      formService,
      'updateSubmissionStatus'
    );
    updateSubmissionStatusSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            submissionStatusId: '1',
          },
        ],
      };
    });
    const getCurrentUserSpy = vi.spyOn(rbacService, 'getCurrentUser');
    getCurrentUserSpy.mockImplementationOnce(() => {
      return {
        data: {
          id: USER_ID,
        },
      };
    });
    const addNoteSpy = vi.spyOn(formService, 'addNote');
    addNoteSpy.mockImplementationOnce(() => {
      return {};
    });

    const addEmailRecipientsSpy = vi.spyOn(formService, 'addEmailRecipients');
    addEmailRecipientsSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.updateStatus();

    expect(updateSubmissionStatusSpy).toBeCalledTimes(1);
    expect(getCurrentUserSpy).toBeCalledTimes(1);
    expect(addNoteSpy).toBeCalledTimes(1);
    expect(getFormUsersSpy).toBeCalledTimes(0);
    expect(getSubmissionStatusesSpy).toBeCalledTimes(0);
    expect(getStatusCodesSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
});
