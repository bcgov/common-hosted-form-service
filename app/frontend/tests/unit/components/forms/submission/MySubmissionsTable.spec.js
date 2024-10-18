import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import getRouter from '~/router';
import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';

describe('MySubmissionsTable.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  const fetchFormSpy = vi.spyOn(formStore, 'fetchForm').mockResolvedValue({});
  const fetchFormFieldsSpy = vi
    .spyOn(formStore, 'fetchFormFields')
    .mockImplementation(() => []);

  beforeEach(() => {
    fetchFormSpy.mockReset();
    fetchFormFieldsSpy.mockReset();
    formStore.$reset();
    appStore.$reset();

    formStore.form = {
      versions: [
        {
          id: '123',
        },
      ],
    };
    formStore.formFields = [];
    formStore.mySubmissionPreferences = {
      preferences: {
        formId: formId,
        columns: [],
      },
    };
  });

  it('renders', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      name: 'This is a form title',
      ...formStore.form,
    };

    await flushPromises();
    expect(wrapper.html()).toContain(
      'trans.mySubmissionsTable.previousSubmissions'
    );
    expect(wrapper.html()).toContain(formStore.form.name);
  });

  it('BASE_HEADERS will contain updatedBy and lastEdited if showDraftLastEdited is enabled', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
      enableSubmitterDraft: true,
    };

    await flushPromises();

    expect(wrapper.vm.BASE_HEADERS).toEqual(
      expect.arrayContaining([
        {
          title: 'trans.mySubmissionsTable.draftUpdatedBy',
          align: 'start',
          key: 'updatedBy',
          sortable: true,
        },
      ])
    );

    expect(wrapper.vm.BASE_HEADERS).toEqual(
      expect.arrayContaining([
        {
          title: 'trans.mySubmissionsTable.draftLastEdited',
          align: 'start',
          key: 'lastEdited',
          sortable: true,
        },
      ])
    );
  });

  it('BASE_HEADERS will append formFields if there are any', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };
    formStore.formFields = ['formField1', 'formField2'];

    await flushPromises();

    expect(wrapper.vm.BASE_HEADERS).toEqual(
      expect.arrayContaining([
        {
          title: 'formField1',
          align: 'start',
          key: 'formField1',
        },
      ])
    );

    expect(wrapper.vm.BASE_HEADERS).toEqual(
      expect.arrayContaining([
        {
          title: 'formField2',
          align: 'start',
          key: 'formField2',
        },
      ])
    );
  });

  it('HEADERS will only contain user selected columns and forced headers if a user selected columns', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };
    formStore.formFields = ['formField1', 'formField2'];

    formStore.mySubmissionPreferences.preferences.columns = [
      'createdBy',
      'username',
      'status',
      'updatedBy',
      'lastEdited',
      'submittedDate',
      'formField1',
    ];

    await flushPromises();

    expect(wrapper.vm.HEADERS).toEqual([
      {
        align: 'start',
        key: 'confirmationId',
        sortable: true,
        title: 'trans.mySubmissionsTable.confirmationId',
      },
      {
        key: 'createdBy',
        sortable: true,
        title: 'trans.mySubmissionsTable.createdBy',
      },
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
      {
        align: 'start',
        key: 'formField1',
        title: 'formField1',
      },
      {
        align: 'end',
        filterable: false,
        key: 'actions',
        sortable: false,
        title: 'trans.mySubmissionsTable.actions',
        width: '40px',
      },
    ]);
  });

  it('BASE_FILTER_HEADERS will contain the BASE_HEADERS minus the headers to ignore in the filter', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };
    formStore.formFields = ['formField1', 'formField2'];

    await flushPromises();

    expect(wrapper.vm.BASE_FILTER_HEADERS).toEqual([
      {
        key: 'createdBy',
        sortable: true,
        title: 'trans.mySubmissionsTable.createdBy',
      },
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
      {
        align: 'start',
        key: 'formField1',
        title: 'formField1',
      },
      {
        align: 'start',
        key: 'formField2',
        title: 'formField2',
      },
    ]);

    wrapper.vm.filterIgnore = [
      {
        key: 'confirmationId',
      },
      {
        key: 'actions',
      },
      {
        key: 'createdBy',
      },
    ];

    await flushPromises();

    expect(wrapper.vm.BASE_FILTER_HEADERS).toEqual([
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
      {
        align: 'start',
        key: 'formField1',
        title: 'formField1',
      },
      {
        align: 'start',
        key: 'formField2',
        title: 'formField2',
      },
    ]);
  });

  it('RESET_HEADERS will contain some default values but can be adjusted based on filter ignore values', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };
    formStore.formFields = ['formField1', 'formField2'];

    await flushPromises();

    expect(wrapper.vm.RESET_HEADERS).toEqual([
      'createdBy',
      'username',
      'status',
      'submittedDate',
    ]);

    wrapper.vm.filterIgnore = [
      {
        key: 'confirmationId',
      },
      {
        key: 'actions',
      },
      {
        key: 'createdBy',
      },
    ];

    await flushPromises();

    expect(wrapper.vm.RESET_HEADERS).toEqual([
      'username',
      'status',
      'submittedDate',
    ]);
  });

  it('PRESELECTED_DATA will contain the HEADERS but can also remove headers that are in the filterIgnore', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };
    formStore.formFields = ['formField1', 'formField2'];

    await flushPromises();

    expect(wrapper.vm.PRESELECTED_DATA).toEqual([
      {
        key: 'createdBy',
        sortable: true,
        title: 'trans.mySubmissionsTable.createdBy',
      },
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
    ]);

    wrapper.vm.filterIgnore = [
      {
        key: 'confirmationId',
      },
      {
        key: 'actions',
      },
      {
        key: 'createdBy',
      },
    ];

    await flushPromises();

    expect(wrapper.vm.PRESELECTED_DATA).toEqual([
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
    ]);
  });

  it('onShowColumnDialog will sort BASE_FILTER_HEADERS and then set showColumnsDialog to true', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };

    await flushPromises();

    expect(wrapper.vm.BASE_FILTER_HEADERS).toEqual([
      {
        key: 'createdBy',
        sortable: true,
        title: 'trans.mySubmissionsTable.createdBy',
      },
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
    ]);
    expect(wrapper.vm.showColumnsDialog).toBeFalsy();

    wrapper.vm.onShowColumnDialog();

    expect(wrapper.vm.BASE_FILTER_HEADERS).toEqual([
      {
        key: 'submittedDate',
        sortable: true,
        title: 'trans.mySubmissionsTable.submissionDate',
      },
      {
        key: 'status',
        sortable: true,
        title: 'trans.mySubmissionsTable.status',
      },
      {
        key: 'username',
        sortable: true,
        title: 'trans.mySubmissionsTable.statusUpdatedBy',
      },
      {
        key: 'createdBy',
        sortable: true,
        title: 'trans.mySubmissionsTable.createdBy',
      },
    ]);
    expect(wrapper.vm.showColumnsDialog).toBeTruthy();
  });

  it('getCurrentStatus will return draft or the status', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };

    await flushPromises();

    expect(
      wrapper.vm.getCurrentStatus({
        submissionStatus: [
          {
            code: 'SUBMITTED',
          },
        ],
      })
    ).toEqual('SUBMITTED');

    expect(
      wrapper.vm.getCurrentStatus({
        submissionStatus: [
          {
            code: 'SUBMITTED',
          },
        ],
        draft: true,
      })
    ).toEqual('DRAFT');

    expect(
      wrapper.vm.getCurrentStatus({
        submissionStatus: [
          {
            code: 'REVISING',
          },
        ],
        draft: true,
      })
    ).toEqual('REVISING');
  });

  it('getStatusDate will return the createdAt date or will return an empty string', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };

    await flushPromises();

    expect(
      wrapper.vm.getStatusDate(
        {
          submissionStatus: [
            {
              code: 'SUBMITTED',
              createdAt: 'somedate',
            },
          ],
        },
        'SUBMITTED'
      )
    ).toEqual('somedate');

    expect(
      wrapper.vm.getStatusDate(
        {
          submissionStatus: [
            {
              code: 'REVISING',
              createdAt: 'somedate',
            },
          ],
        },
        'SUBMITTED'
      )
    ).toEqual('');
  });

  it('populateSubmissionsTable should generate the table', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockImplementation((date) => date),
          },
        },
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };

    await flushPromises();

    expect(wrapper.vm.serverItems).toEqual([]);
    formStore.submissionList = [
      {
        active: true,
        confirmationId: 'confirmationId',
        createdAt: '2024-07-08',
        deleted: false,
        description: '',
        draft: true,
        enableStatusUpdates: true,
        enableSubmitterDraft: true,
        formId: 'formId',
        formSubmissionId: 'formSubmissionId',
        id: 'id',
        name: 'FORM!',
        permissions: [
          'submission_create',
          'submission_delete',
          'submission_read',
          'submission_update',
        ],
        submission: {
          submission: {
            data: {
              name: {
                value: 'something',
              },
              formField1: {
                value: 'something',
              },
            },
          },
        },
        submissionStatus: [],
        updatedAt: '2024-07-08',
        userId: 'userId',
        version: 1,
      },
    ];
    await wrapper.vm.populateSubmissionsTable();
    expect(wrapper.vm.serverItems).toEqual([
      {
        confirmationId: 'confirmationId',
        name: 'FORM!',
        permissions: [
          'submission_create',
          'submission_delete',
          'submission_read',
          'submission_update',
        ],
        status: 'DRAFT',
        submissionId: 'formSubmissionId',
        submittedDate: '',
        createdBy: undefined,
        updatedBy: undefined,
        lastEdited: undefined,
        username: '',
        name_1: '{"value":"something"}',
        formField1: '{"value":"something"}',
      },
    ]);
  });

  it('updateFilter will set the filterData to the data parameter and hide the show columns dialog', async () => {
    const fetchSubmissionsSpy = vi.spyOn(formStore, 'fetchSubmissions');
    fetchSubmissionsSpy.mockImplementationOnce(() => {
      formStore.submissionList = [];
    });
    const wrapper = mount(MySubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });
    formStore.form = {
      ...formStore.form,
      name: 'This is a form title',
    };

    await flushPromises();

    wrapper.vm.showColumnsDialog = true;

    expect(formStore.mySubmissionPreferences.preferences.columns).toEqual([]);
    expect(wrapper.vm.showColumnsDialog).toBeTruthy();

    wrapper.vm.updateFilter(['createdBy']);

    expect(formStore.mySubmissionPreferences.preferences.columns).toEqual(['createdBy']);
    expect(wrapper.vm.showColumnsDialog).toBeFalsy();
  });
});
