const { MockModel, MockTransaction } = require('../../../common/dbHelper');

const uuid = require('uuid');

const { EmailTypes, ScheduleType } = require('../../../../src/forms/common/constants');
const service = require('../../../../src/forms/form/service');

jest.mock('../../../../src/forms/common/models/tables/formEmailTemplate', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/submissionMetadata', () => MockModel);
jest.mock('../../../../src/forms/common/scheduleService', () => ({
  checkIsFormExpired: jest.fn(),
  isDateValid: jest.fn(() => true),
  isDateInFuture: jest.fn(() => false),
  validateSubmissionSchedule: jest.fn(),
}));

const { eventStreamService } = require('../../../../src/components/eventStreamService');
const formMetadataService = require('../../../../src/forms/form/formMetadata/service');
const eventStreamConfigService = require('../../../../src/forms/form/eventStreamConfig/service');
const eventService = require('../../../../src/forms//event/eventService');
const { validateSubmissionSchedule } = require('../../../../src/forms/common/scheduleService');

const {
  Form,
  FormIdentityProvider,
  FormRoleUser,
  FormStatusCode,
  IdentityProvider,
  FormVersionDraft,
  FormVersion,
  FormSubmission,
  FormSubmissionUser,
  FormSubmissionStatus,
  SubmissionMetadata,
  FormApiKey,
  FormSubscription,
  FormComponentsProactiveHelp,
} = require('../../../../src/forms/common/models');

const formId = uuid.v4();

const currentUser = {
  usernameIdp: 'TESTER',
  id: uuid.v4(),
};

const emailTemplateSubmissionConfirmation = {
  body: 'default submission confirmation body',
  formId: formId,
  subject: 'default submission confirmation subject',
  title: 'default submission confirmation title',
  type: EmailTypes.SUBMISSION_CONFIRMATION,
};

const emailTemplate = {
  body: 'body',
  formId: formId,
  subject: 'subject',
  title: 'title',
  type: EmailTypes.SUBMISSION_CONFIRMATION,
};
function resetModels() {
  Form.query = jest.fn().mockReturnThis();
  Form.where = jest.fn().mockReturnThis();
  Form.modify = jest.fn().mockReturnThis();
  Form.first = jest.fn().mockReturnThis();
  Form.insert = jest.fn().mockReturnThis();
  Form.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
  Form.patchAndFetchById = jest.fn().mockReturnThis();
  Form.findById = jest.fn().mockReturnThis();
  Form.allowGraph = jest.fn().mockReturnThis();
  Form.withGraphFetched = jest.fn().mockReturnThis();
  Form.throwIfNotFound = jest.fn().mockResolvedValue({
    id: formId,
    name: 'Test Form',
    showAssigneeInSubmissionsTable: true,
    enableStatusUpdates: true,
    identityProviders: [{ code: 'idir' }],
    versions: [],
  });

  // FormVersion model setup
  FormVersion.query = jest.fn().mockReturnThis();
  FormVersion.where = jest.fn().mockReturnThis();
  FormVersion.modify = jest.fn().mockReturnThis();
  FormVersion.first = jest.fn().mockReturnThis();
  FormVersion.insert = jest.fn().mockReturnThis();
  FormVersion.patch = jest.fn().mockReturnThis();
  FormVersion.findById = jest.fn().mockReturnThis();
  FormVersion.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
  FormVersion.throwIfNotFound = jest.fn().mockResolvedValue({
    id: uuid.v4(),
    formId: formId,
    schema: { components: [] },
  });

  // IdentityProvider model setup
  IdentityProvider.query = jest.fn().mockReturnThis();
  IdentityProvider.where = jest.fn().mockReturnThis();
  IdentityProvider.modify = jest.fn().mockReturnThis();
  IdentityProvider.first = jest.fn().mockResolvedValue({ code: 'idir', active: true });
  IdentityProvider.insert = jest.fn().mockReturnThis();

  // FormIdentityProvider model setup
  FormIdentityProvider.query = jest.fn().mockReturnThis();
  FormIdentityProvider.where = jest.fn().mockReturnThis();
  FormIdentityProvider.modify = jest.fn().mockReturnThis();
  FormIdentityProvider.first = jest.fn().mockReturnThis();
  FormIdentityProvider.insert = jest.fn().mockReturnThis();
  FormIdentityProvider.delete = jest.fn().mockReturnThis();

  // FormRoleUser model setup
  FormRoleUser.query = jest.fn().mockReturnThis();
  FormRoleUser.where = jest.fn().mockReturnThis();
  FormRoleUser.modify = jest.fn().mockReturnThis();
  FormRoleUser.first = jest.fn().mockReturnThis();
  FormRoleUser.insert = jest.fn().mockReturnThis();

  // FormStatusCode model setup
  FormStatusCode.query = jest.fn().mockReturnThis();
  FormStatusCode.where = jest.fn().mockReturnThis();
  FormStatusCode.modify = jest.fn().mockReturnThis();
  FormStatusCode.first = jest.fn().mockReturnThis();
  FormStatusCode.insert = jest.fn().mockReturnThis();

  // FormVersionDraft model setup
  FormVersionDraft.query = jest.fn().mockReturnThis();
  FormVersionDraft.where = jest.fn().mockReturnThis();
  FormVersionDraft.modify = jest.fn().mockReturnThis();
  FormVersionDraft.first = jest.fn().mockReturnThis();
  FormVersionDraft.insert = jest.fn().mockReturnThis();
  FormVersionDraft.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
  FormVersionDraft.deleteById = jest.fn().mockResolvedValue(MockTransaction);
  FormVersionDraft.findById = jest.fn().mockReturnThis();
  FormVersionDraft.throwIfNotFound = jest.fn().mockResolvedValue({
    id: uuid.v4(),
    formId: formId,
    schema: { components: [] },
  });

  // FormSubmission model setup
  FormSubmission.query = jest.fn().mockReturnThis();
  FormSubmission.where = jest.fn().mockReturnThis();
  FormSubmission.modify = jest.fn().mockReturnThis();
  FormSubmission.first = jest.fn().mockReturnThis();
  FormSubmission.insert = jest.fn().mockReturnThis();
  FormSubmission.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
  FormSubmission.deleteById = jest.fn().mockResolvedValue(MockTransaction);
  FormSubmission.findById = jest.fn().mockReturnThis();
  FormSubmission.throwIfNotFound = jest.fn().mockResolvedValue({
    id: uuid.v4(),
    formVersionId: uuid.v4(),
    submission: { data: {} },
  });

  // FormSubmissionUser model setup
  FormSubmissionUser.query = jest.fn().mockReturnThis();
  FormSubmissionUser.where = jest.fn().mockReturnThis();
  FormSubmissionUser.modify = jest.fn().mockReturnThis();
  FormSubmissionUser.first = jest.fn().mockReturnThis();
  FormSubmissionUser.insert = jest.fn().mockReturnThis();

  // FormSubmissionStatus model setup
  FormSubmissionStatus.query = jest.fn().mockReturnThis();
  FormSubmissionStatus.where = jest.fn().mockReturnThis();
  FormSubmissionStatus.modify = jest.fn().mockReturnThis();
  FormSubmissionStatus.first = jest.fn().mockReturnThis();
  FormSubmissionStatus.insert = jest.fn().mockReturnThis();

  FormApiKey.query = jest.fn().mockReturnThis();
  FormApiKey.where = jest.fn().mockReturnThis();
  FormApiKey.modify = jest.fn().mockReturnThis();
  FormApiKey.first = jest.fn().mockReturnThis();
  FormApiKey.insert = jest.fn().mockReturnThis();
  FormApiKey.update = jest.fn().mockReturnThis();
  FormApiKey.deleteById = jest.fn().mockReturnThis();
  FormApiKey.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
  FormApiKey.patchAndFetchById = jest.fn().mockReturnThis();
  FormApiKey.findById = jest.fn().mockReturnThis();
  FormApiKey.allowGraph = jest.fn().mockReturnThis();
  FormApiKey.withGraphFetched = jest.fn().mockReturnThis();
  FormApiKey.throwIfNotFound = jest.fn().mockResolvedValue({
    id: formId,
    formId: formId,
    secret: 'secret',
    filesApiAccess: false,
  });
}

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
  resetModels();
});

afterEach(() => {
  jest.restoreAllMocks();
});
// Mock external services at the top of the file
jest.mock('../../../../src/forms/form/formMetadata/service', () => ({
  upsert: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../src/forms/form/eventStreamConfig/service', () => ({
  upsert: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../../src/forms/event/eventService', () => ({
  publishFormEvent: jest.fn(),
  formSubmissionEventReceived: jest.fn(),
}));

jest.mock('../../../../src/components/eventStreamService', () => ({
  eventStreamService: {
    onPublish: jest.fn().mockResolvedValue({}),
    onSubmit: jest.fn().mockResolvedValue({}),
  },
  SUBMISSION_EVENT_TYPES: {
    CREATED: 'created',
  },
}));

describe('_findFileIds', () => {
  it('should handle a blank everything', () => {
    const schema = {
      components: [],
    };
    const data = {
      submission: {
        data: {},
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return an empty array if no file controls', () => {
    const schema = {
      components: [
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return an empty array if there is a file control with no file in it', () => {
    const schema = {
      components: [
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
        {
          type: 'simplefile',
          key: 'theFirstFile',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return an empty array if there are multiple file controls with no files in them', () => {
    const schema = {
      components: [
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
        {
          type: 'simplefile',
          key: 'theFirstFile',
        },
        {
          type: 'simpletextfield',
          key: 'bTextBox',
        },
        {
          type: 'simplefile',
          key: 'theSecondFile',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [],
          theSecondFile: [],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return a fileId for a populated file control', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile',
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '009c1edc-59f5-462f-bdd1-460aa71b9e22',
              },
              originalName: 'v18.json',
            },
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual(['009c1edc-59f5-462f-bdd1-460aa71b9e22']);
  });

  it('should return a list of fileIds for multiple populated file controls', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile',
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
        {
          type: 'simplefile',
          key: 'theSecondFile',
        },
        {
          type: 'simpletextfield',
          key: 'bTextBox',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theFirstFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '009c1edc-59f5-462f-bdd1-460aa71b9e22',
              },
              originalName: 'v18.json',
            },
          ],
          bTextBox: 'yes',
          theSecondFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '70daceba-14cf-42c9-8532-9e5717809266',
              },
              originalName: 'something.docx',
            },
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual(['009c1edc-59f5-462f-bdd1-460aa71b9e22', '70daceba-14cf-42c9-8532-9e5717809266']);
  });

  it('should return a blank array for a hidden file control', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile',
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual([]);
  });

  it('should return a single item array for 1 shown, and 1 hidden file control', () => {
    const schema = {
      components: [
        {
          type: 'simplefile',
          key: 'theFirstFile',
        },
        {
          type: 'simpletextfield',
          key: 'aTextBox',
        },
        {
          type: 'simplefile',
          key: 'theSecondFile',
        },
      ],
    };
    const data = {
      submission: {
        data: {
          aTextBox: '',
          theSecondFile: [
            {
              storage: 'chefs',
              url: '/app/api/v1/files/009c1edc-59f5-462f-bdd1-460aa71b9e22',
              size: 253400,
              data: {
                id: '70daceba-14cf-42c9-8532-9e5717809266',
              },
              originalName: 'something.docx',
            },
          ],
        },
      },
    };
    const fileIds = service._findFileIds(schema, data);
    expect(fileIds).toEqual(['70daceba-14cf-42c9-8532-9e5717809266']);
  });
});

describe('listFormSubmissions', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();

    // Mock the form that readForm will return
    const mockForm = {
      id: formId,
      name: 'Test Form',
      showAssigneeInSubmissionsTable: false,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'idir' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    // Mock the submission metadata query
    MockModel.mockResolvedValue([]);
  });

  describe('should not error when sortBy column is not in select', () => {
    test('sort by column not in select', async () => {
      await service.listFormSubmissions(formId, {
        sortBy: {
          column: 'x',
        },
      });
      expect(MockModel.select).toBeCalledTimes(1);
    });
  });

  it('should not error if fields has a trailing comma', async () => {
    await service.listFormSubmissions(formId, { fields: 'x,' });

    expect(MockModel.select).toBeCalledTimes(1);
  });
});

describe('listFormSubmissions - assignment filtering', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();

    // Mock submission metadata query
    MockModel.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call basic query methods', async () => {
    const mockForm = {
      id: formId,
      showAssigneeInSubmissionsTable: false,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'idir' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    const params = { fields: ['field1'] };
    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
  });

  it('should handle filterAssignedToCurrentUser parameter', async () => {
    const mockForm = {
      id: formId,
      showAssigneeInSubmissionsTable: false,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'idir' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    const params = {
      filterAssignedToCurrentUser: true,
      fields: ['field1'],
    };

    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
  });

  it('should handle filterAssignedToCurrentUser with different field combinations', async () => {
    const mockForm = {
      id: formId,
      showAssigneeInSubmissionsTable: false,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'idir' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    const params = {
      filterAssignedToCurrentUser: false,
      submissionId: 'test-id',
      fields: ['field1', 'assignee'],
    };

    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledWith('filterSubmissionId', 'test-id');
  });

  it('should include assignee fields when both conditions are met', async () => {
    const mockForm = {
      id: formId,
      name: 'Test Form',
      showAssigneeInSubmissionsTable: true,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'public' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    await service.listFormSubmissions(formId, { fields: ['field1'] });

    expect(MockModel.select).toHaveBeenCalledWith(
      expect.arrayContaining(['formSubmissionAssignedToUserId', 'formSubmissionAssignedToUsernameIdp', 'formSubmissionAssignedToEmail']),
      expect.any(Array)
    );
  });

  it('should not include assignee fields when showAssigneeInSubmissionsTable is false', async () => {
    const mockForm = {
      id: formId,
      showAssigneeInSubmissionsTable: false,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'idir' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    await service.listFormSubmissions(formId, { fields: ['field1'] });

    expect(MockModel.select).toHaveBeenCalledWith(
      expect.not.arrayContaining(['formSubmissionAssignedToUserId', 'formSubmissionAssignedToUsernameIdp', 'formSubmissionAssignedToEmail']),
      expect.any(Array)
    );
  });

  it('should not include assignee fields when enableStatusUpdates is false', async () => {
    const mockForm = {
      id: formId,
      showAssigneeInSubmissionsTable: true,
      enableStatusUpdates: false,
      identityProviders: [{ code: 'bceid' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockForm);

    await service.listFormSubmissions(formId, { fields: ['field1'] });

    expect(MockModel.select).toHaveBeenCalledWith(
      expect.not.arrayContaining(['formSubmissionAssignedToUserId', 'formSubmissionAssignedToUsernameIdp', 'formSubmissionAssignedToEmail']),
      expect.any(Array)
    );
  });
});

describe('readVersionFields', () => {
  it('should not return hidden fields', async () => {
    const schema = {
      type: 'form',
      components: [
        {
          input: true,
          hidden: true,
          key: 'firstName',
          type: 'textfield',
        },
      ],
    };

    // mock readVersion function
    service.readVersion = jest.fn().mockReturnValue({ schema });
    // get fields
    const fields = await service.readVersionFields();
    // test cases
    expect(fields.length).toEqual(0);
  });

  it('should return right number of fields without columns', async () => {
    const schema = {
      type: 'form',
      components: [
        {
          type: 'textfield',
          input: true,
          key: 'firstName',
        },
      ],
    };

    // mock readVersion function
    service.readVersion = jest.fn().mockReturnValue({ schema });
    // get fields
    const fields = await service.readVersionFields();
    // test cases
    expect(fields.length).toEqual(1);
  });

  it('should return right number of fields with columns', async () => {
    const schema = {
      type: 'form',
      components: [
        {
          type: 'textfield',
          input: true,
          key: 'firstName',
        },
        {
          type: 'columns',
          input: false,
          key: 'myColumns',
          columns: [
            {
              size: 'lg',
              components: [],
            },
            {
              size: 'lg',
              components: [
                {
                  type: 'textfield',
                  input: true,
                  key: 'lastName',
                },
              ],
            },
            {
              size: 'lg',
              components: [],
            },
          ],
        },
      ],
    };

    // mock readVersion function
    service.readVersion = jest.fn().mockReturnValue({ schema });
    // get fields
    const fields = await service.readVersionFields();
    // test cases
    expect(fields.length).toEqual(2);
  });

  it('should return right number of fields in a table', async () => {
    const schema = {
      type: 'form',
      components: [
        {
          key: 'table',
          rows: [
            [
              {
                components: [
                  {
                    input: true,
                    key: 'key',
                  },
                ],
              },
            ],
          ],
        },
      ],
    };

    // mock readVersion function
    service.readVersion = jest.fn().mockReturnValue({ schema });
    // get fields
    const fields = await service.readVersionFields();
    // test cases
    expect(fields.length).toEqual(1);
  });
});

describe('processPaginationData', () => {
  const SubmissionData = require('../../../fixtures/submission/kitchen_sink_submission_pagination.json');

  it('fetch first-page data with 10 items per page', async () => {
    MockModel.query.mockImplementationOnce((data) => {
      return {
        page: function (page, itemsPerPage) {
          let start = page * itemsPerPage;
          let end = page * itemsPerPage + itemsPerPage;
          return { results: data.slice(start, end), total: data.length };
        },
        modify: () => jest.fn().mockReturnThis(),
      };
    });
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 10, 0, null, false);
    expect(result.results).toHaveLength(10);
    expect(result.total).toEqual(SubmissionData.length);
  });
  it('fetch first-page data with 5 items per page', async () => {
    MockModel.query.mockImplementationOnce((data) => {
      return {
        page: function (page, itemsPerPage) {
          let start = page * itemsPerPage;
          let end = page * itemsPerPage + itemsPerPage;
          return { results: data.slice(start, end), total: data.length };
        },
        modify: () => jest.fn().mockReturnThis(),
      };
    });
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 5, 0, null, false);
    expect(result.results).toHaveLength(5);
    expect(result.total).toEqual(SubmissionData.length);
  });
  it('fetch second-page data with 5 items per page', async () => {
    MockModel.query.mockImplementationOnce((data) => {
      return {
        page: function (page, itemsPerPage) {
          let start = page * itemsPerPage;
          let end = page * itemsPerPage + itemsPerPage;
          return { results: data.slice(start, end), total: data.length };
        },
        modify: () => jest.fn().mockReturnThis(),
      };
    });
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 1, 5, 0, null, false);
    expect(result.results).toHaveLength(5);
    expect(result.total).toEqual(SubmissionData.length);
  });
  it('search submission data with pagination base on datetime', async () => {
    MockModel.query.mockImplementationOnce((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 5, 0, '2023-08-19T19:11', true);
    expect(result.results).toHaveLength(3);
    expect(result.total).toEqual(3);
  });
  it('search submission data with pagination base on any value (first page)', async () => {
    MockModel.query.mockImplementationOnce((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 5, 0, 'a', true);
    expect(result.results).toHaveLength(5);
  });
  it('search submission data with pagination base on any value (second page)', async () => {
    MockModel.query.mockImplementationOnce((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 1, 5, 0, 'a', true);
    expect(result.results).toHaveLength(5);
  });
  it('search submission data with pagination base on any value (test for case)', async () => {
    MockModel.query.mockImplementationOnce((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 10, 0, 'A', true);
    expect(result.results).toHaveLength(10);
  });
});

describe('popFormLevelInfo', () => {
  it('should remove all the form level properties', () => {
    const givenArrayOfSubmission = [
      {
        form: {
          confirmationId: '3A31A078',
          formName: 'FormTest',
          version: 4,
          createdAt: '2023-08-31T16:50:33.571Z',
          fullName: 'John DOe',
          username: 'JOHNDOE',
          email: 'john.doe@example.ca',
          status: 'SUBMITTED',
          assignee: null,
          assigneeEmail: null,
        },
        lateEntry: false,
        simplenumber: 4444,
      },
    ];
    const expectedArrayOfSubmission = [
      {
        form: {},
        simplenumber: 4444,
      },
    ];

    const response = service.popFormLevelInfo(givenArrayOfSubmission);
    expect(response).toEqual(expectedArrayOfSubmission);
  });
});

describe('Validation Functions', () => {
  it('validateScheduleObject should return status = success for empty object passed as parameter', () => {
    let result = service.validateScheduleObject({});
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('message', '');
  });

  it('validateScheduleObject should return status = success for schedule type manual and with its required data', () => {
    let testPayload = { enabled: true, scheduleType: ScheduleType.MANUAL, openSubmissionDateTime: '2023-03-31' };
    let result = service.validateScheduleObject(testPayload);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('message', '');
  });

  it('validateScheduleObject should return status = success for schedule type closingDate and with its required data', () => {
    let testPayload = {
      enabled: true,
      scheduleType: ScheduleType.CLOSINGDATE,
      openSubmissionDateTime: '2023-03-31',
      closeSubmissionDateTime: '2023-09-31',
    };
    let result = service.validateScheduleObject(testPayload);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('message', '');
  });
});

describe('_getDefaultEmailTemplate', () => {
  it('should return a template', async () => {
    const formId = uuid.v4();
    const template = service._getDefaultEmailTemplate(formId, EmailTypes.SUBMISSION_CONFIRMATION);

    expect(template.formId).toEqual(formId);
    expect(template.type).toEqual(EmailTypes.SUBMISSION_CONFIRMATION);
    expect(template).toHaveProperty('body');
    expect(template).toHaveProperty('subject');
    expect(template).toHaveProperty('title');
  });
});

describe('readEmailTemplate', () => {
  it('should return template by searching form ID and type', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue(emailTemplate);

    const template = await service.readEmailTemplate(emailTemplate.formId, emailTemplate.type);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(2);
    expect(MockModel.modify).toBeCalledWith('filterFormId', emailTemplate.formId);
    expect(MockModel.modify).toBeCalledWith('filterType', emailTemplate.type);
    expect(template).toEqual(emailTemplate);
  });

  it('should return default template when form ID and type not found', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue();

    const template = await service.readEmailTemplate(emailTemplate.formId, emailTemplate.type);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(2);
    expect(MockModel.modify).toBeCalledWith('filterFormId', emailTemplate.formId);
    expect(MockModel.modify).toBeCalledWith('filterType', emailTemplate.type);
    expect(template).toEqual(emailTemplateSubmissionConfirmation);
  });
});

describe('readEmailTemplates', () => {
  it('should return template by searching form ID', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue([emailTemplate]);

    const template = await service.readEmailTemplates(emailTemplate.formId);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledWith('filterFormId', emailTemplate.formId);
    expect(template).toEqual([emailTemplate]);
  });

  it('should return default template when form ID not found', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue([]);

    const template = await service.readEmailTemplates(emailTemplate.formId);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledWith('filterFormId', emailTemplate.formId);
    expect(template).toEqual([emailTemplateSubmissionConfirmation]);
  });
});

describe('createOrUpdateEmailTemplates', () => {
  const user = { usernameIdp: 'username' };

  it('should create template when it does not exist', async () => {
    service.readEmailTemplate = jest.fn().mockReturnValue(emailTemplate);
    service.readEmailTemplates = jest.fn().mockReturnValue([emailTemplate]);

    await service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user);

    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      createdBy: user.usernameIdp,
      id: expect.any(String),
      ...emailTemplate,
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should update template when it already exists', async () => {
    const id = uuid.v4();
    service.readEmailTemplate = jest.fn().mockReturnValue({ id: id, ...emailTemplate });
    service.readEmailTemplates = jest.fn().mockReturnValue([{ id: id, ...emailTemplate }]);

    await service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user);

    expect(MockModel.update).toBeCalledTimes(1);
    expect(MockModel.update).toBeCalledWith({
      updatedBy: user.usernameIdp,
      ...emailTemplate,
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should not rollback when an error occurs outside transaction', async () => {
    service.readEmailTemplate = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });

  it('should rollback when an insert error occurs inside transaction', async () => {
    service.readEmailTemplate = jest.fn().mockReturnValue(emailTemplate);
    service.readEmailTemplates = jest.fn().mockReturnValue([emailTemplate]);
    MockModel.insert = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });

  it('should rollback when an update error occurs inside transaction', async () => {
    const id = uuid.v4();
    service.readEmailTemplate = jest.fn().mockReturnValue({ id: id, ...emailTemplate });
    service.readEmailTemplates = jest.fn().mockReturnValue([{ id: id, ...emailTemplate }]);
    MockModel.update = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });
});

describe('_validateReminderSettings', () => {
  afterEach(() => {
    // Restore any mocked functions after each test
    jest.restoreAllMocks();
  });

  it('returns false if reminder_enabled is false', () => {
    const data = { reminder_enabled: false };
    expect(service._validateReminderSettings(data)).toBe(false);
  });

  it('returns false if schedule is missing or not enabled or manual type', () => {
    const cases = [
      { reminder_enabled: true }, // no schedule
      { reminder_enabled: true, schedule: { enabled: false } },
      { reminder_enabled: true, schedule: { enabled: true, scheduleType: ScheduleType.MANUAL } },
    ];

    cases.forEach((data) => {
      expect(service._validateReminderSettings(data)).toBe(false);
    });
  });
});

describe('validation helpers', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  // isLateSubmissionConfigValid: missing term/intervalType
  it('should return false for missing term/intervalType in late submission config', () => {
    const schedule = { allowLateSubmissions: { enabled: true, forNext: {} } };
    expect(service.isLateSubmissionConfigValid(schedule)).toBe(false);
  });

  // isClosingMessageValid: missing closingMessage
  it('should return false if closingMessageEnabled is true but closingMessage is missing', () => {
    expect(service.isClosingMessageValid({ closingMessageEnabled: true })).toBe(false);
  });
  // validateScheduleObject: invalid openSubmissionDateTime
  it('should return error for invalid openSubmissionDateTime', () => {
    const schedule = { enabled: true, openSubmissionDateTime: 'invalid-date' };
    const result = service.validateScheduleObject(schedule);
    expect(result.status).toBe('error');
  });
});

describe('createForm', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw 422 if schedule is invalid in createForm', async () => {
    await expect(service.createForm({ schedule: { enabled: true, openSubmissionDateTime: 'bad' } }, currentUser)).rejects.toThrow('422');
  });
  it('should upsert event stream configuration and form metadata', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({});
    formMetadataService.upsert = jest.fn().mockResolvedValueOnce();
    eventStreamConfigService.upsert = jest.fn().mockResolvedValueOnce();

    const data = { identityProviders: [{ code: 'test' }] };
    await service.createForm(data, currentUser);

    expect(formMetadataService.upsert).toBeCalledTimes(1);
    expect(eventStreamConfigService.upsert).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should rollback and throw if createForm fails', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    Form.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    Form.query = jest.fn().mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(service.createForm({ name: 'fail' }, currentUser)).rejects.toThrow('DB error');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });

  it('should properly handle enableSubmitterRevision in createForm', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({});
    formMetadataService.upsert = jest.fn().mockResolvedValueOnce();
    eventStreamConfigService.upsert = jest.fn().mockResolvedValueOnce();

    const data = {
      name: 'Test Form',
      identityProviders: [{ code: 'idir' }],
      enableSubmitterRevision: true,
      enableStatusUpdates: false,
      showAssigneeInSubmissionsTable: true,
    };

    // Mock the Form.insert to capture what's being inserted
    const mockInsert = jest.fn().mockResolvedValue({ id: formId });
    Form.query = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    await service.createForm(data, currentUser);

    // Verify that enableSubmitterRevision was passed to the insert
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        enableSubmitterRevision: true,
        enableStatusUpdates: false,
        showAssigneeInSubmissionsTable: true, // Should be true because of the OR logic
      })
    );
  });
});

describe('updateForm', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should upsert event stream configuration and form metadata', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({});
    formMetadataService.upsert = jest.fn().mockResolvedValueOnce();
    eventStreamConfigService.upsert = jest.fn().mockResolvedValueOnce();

    const data = { identityProviders: [{ code: 'test' }] };
    await service.updateForm(formId, data, currentUser);

    expect(formMetadataService.upsert).toBeCalledTimes(1);
    expect(eventStreamConfigService.upsert).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should rollback and throw if updateForm fails', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockResolvedValue({ id: formId });
    Form.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    Form.query = jest.fn().mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(service.updateForm(formId, { name: 'fail', schedule: {} }, currentUser)).rejects.toThrow('DB error');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });

  it('should properly handle enableSubmitterRevision in updateForm', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockResolvedValue({ id: formId });
    formMetadataService.upsert = jest.fn().mockResolvedValueOnce();
    eventStreamConfigService.upsert = jest.fn().mockResolvedValueOnce();

    const data = {
      name: 'Updated Test Form',
      identityProviders: [{ code: 'idir' }],
      enableSubmitterRevision: true,
      enableStatusUpdates: false,
      showAssigneeInSubmissionsTable: true,
    };

    // Mock the Form.patchAndFetchById to capture what's being updated
    const mockPatchAndFetchById = jest.fn().mockResolvedValue({ id: formId });
    Form.query = jest.fn().mockReturnValue({
      patchAndFetchById: mockPatchAndFetchById,
    });

    await service.updateForm(formId, data, currentUser);

    // Verify that enableSubmitterRevision was passed to the patch
    expect(mockPatchAndFetchById).toHaveBeenCalledWith(
      formId,
      expect.objectContaining({
        enableSubmitterRevision: true,
        enableStatusUpdates: false,
        showAssigneeInSubmissionsTable: true, // Should be true because of the OR logic
      })
    );
  });
});

describe('deleteForm', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should rollback and throw if deleteForm fails', async () => {
    service.readForm = jest.fn().mockResolvedValue({ id: formId });
    Form.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    Form.query = jest.fn().mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(service.deleteForm(formId, {}, currentUser)).rejects.toThrow('DB error');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });
});

describe('publishVersion', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should delete submissionReceivedEmails in readPublishedForm', async () => {
    Form.query = jest.fn().mockReturnThis();
    Form.findById = jest.fn().mockReturnThis();
    Form.modify = jest.fn().mockReturnThis();
    Form.allowGraph = jest.fn().mockReturnThis();
    Form.withGraphFetched = jest.fn().mockReturnThis();
    Form.throwIfNotFound = jest.fn().mockResolvedValue({
      id: formId,
      submissionReceivedEmails: ['a@b.com'],
      schedule: {},
    });

    const result = await service.readPublishedForm(formId);
    expect(result.submissionReceivedEmails).toBeUndefined();
  });
  it('should trigger event notifications', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({});
    service.readPublishedForm = jest.fn().mockReturnValueOnce({});
    eventService.publishFormEvent = jest.fn().mockResolvedValueOnce();
    eventStreamService.onPublish = jest.fn().mockResolvedValueOnce();

    await service.publishVersion(formId, '123', currentUser, {});

    expect(eventService.publishFormEvent).toBeCalledTimes(1);
    expect(eventStreamService.onPublish).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });
});

describe('publishDraft', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should trigger event notifications', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({ id: formId, versions: [{ version: 1 }] });
    service.readDraft = jest.fn().mockReturnValueOnce({});
    service.readVersion = jest.fn().mockReturnValueOnce({});
    eventService.publishFormEvent = jest.fn().mockResolvedValueOnce();
    eventStreamService.onPublish = jest.fn().mockResolvedValueOnce();

    await service.publishDraft(formId, '123', currentUser);

    expect(eventService.publishFormEvent).toBeCalledTimes(1);
    expect(eventStreamService.onPublish).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });
});

describe('createSubmission', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
    validateSubmissionSchedule.mockClear();
    // Reset to default implementation that handles null/undefined gracefully
    validateSubmissionSchedule.mockImplementation((schedule) => {
      // validateSubmissionSchedule should not throw for null/undefined/disabled schedules
      if (!schedule || !schedule.enabled) {
        return;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should trigger event notifications', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({ id: formId, versions: [{ version: 1 }], identityProviders: [] });
    service.readSubmission = jest.fn().mockReturnValueOnce({});
    service.readVersion = jest.fn().mockReturnValueOnce({ id: '123', formId: formId, schema: {} });
    eventService.formSubmissionEventReceived = jest.fn().mockReturnValueOnce();
    eventStreamService.onSubmit = jest.fn().mockResolvedValueOnce();

    const data = { draft: false, submission: { data: {} } };
    await service.createSubmission('123', data, currentUser);

    expect(eventService.formSubmissionEventReceived).toBeCalledTimes(1);
    expect(eventStreamService.onSubmit).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should validate schedule before allowing submission', async () => {
    const formSchedule = { enabled: true, scheduleType: ScheduleType.CLOSINGDATE };
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({
      id: formId,
      versions: [{ version: 1 }],
      identityProviders: [],
      schedule: formSchedule,
    });
    service.readSubmission = jest.fn().mockReturnValueOnce({});
    service.readVersion = jest.fn().mockReturnValueOnce({ id: '123', formId: formId, schema: {} });
    eventService.formSubmissionEventReceived = jest.fn().mockReturnValueOnce();
    eventStreamService.onSubmit = jest.fn().mockResolvedValueOnce();
    // Override default mock for this test to verify it's called
    validateSubmissionSchedule.mockImplementation(() => {});

    const data = { draft: false, submission: { data: {} } };
    await service.createSubmission('123', data, currentUser);

    expect(validateSubmissionSchedule).toHaveBeenCalledWith(formSchedule);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should throw error when schedule validation fails', async () => {
    const formSchedule = { enabled: true, scheduleType: ScheduleType.CLOSINGDATE };
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({
      id: formId,
      versions: [{ version: 1 }],
      identityProviders: [],
      schedule: formSchedule,
    });
    service.readVersion = jest.fn().mockReturnValueOnce({ id: '123', formId: formId, schema: {} });
    const scheduleError = new Error('Form submission period has expired');
    scheduleError.status = 403;
    validateSubmissionSchedule.mockImplementation(() => {
      throw scheduleError;
    });

    const data = { draft: false, submission: { data: {} } };
    await expect(service.createSubmission('123', data, currentUser)).rejects.toThrow('Form submission period has expired');

    expect(validateSubmissionSchedule).toHaveBeenCalledWith(formSchedule);
    expect(MockTransaction.commit).not.toHaveBeenCalled();
  });

  it('should not validate schedule when form has no schedule', async () => {
    service.validateScheduleObject = jest.fn().mockReturnValueOnce({ status: 'success' });
    service.readForm = jest.fn().mockReturnValueOnce({
      id: formId,
      versions: [{ version: 1 }],
      identityProviders: [],
      schedule: null,
    });
    service.readSubmission = jest.fn().mockReturnValueOnce({});
    service.readVersion = jest.fn().mockReturnValueOnce({ id: '123', formId: formId, schema: {} });
    eventService.formSubmissionEventReceived = jest.fn().mockReturnValueOnce();
    eventStreamService.onSubmit = jest.fn().mockResolvedValueOnce();

    const data = { draft: false, submission: { data: {} } };
    await service.createSubmission('123', data, currentUser);

    expect(validateSubmissionSchedule).toHaveBeenCalledWith(null);
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });
});

describe('Assignee Visibility Feature Tests', () => {
  describe('_setAssigneeInSubmissionsTable', () => {
    it('should return false when showAssigneeInSubmissionsTable is not true', () => {
      const formData = {
        showAssigneeInSubmissionsTable: false,
        enableStatusUpdates: true,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(false);
    });

    it('should return false when showAssigneeInSubmissionsTable is undefined', () => {
      const formData = {
        enableStatusUpdates: true,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(false);
    });

    it('should return false when status updates are not enabled', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: false,
        enableSubmitterRevision: false,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(false);
    });

    it('should return true when both conditions are met regardless of form type', () => {
      const testCases = [{ code: 'public' }, { code: 'idir' }, { code: 'bceid' }, { code: 'bceidbusiness' }];

      testCases.forEach((identityProvider) => {
        const formData = {
          showAssigneeInSubmissionsTable: true,
          enableStatusUpdates: true,
          enableSubmitterRevision: false,
          identityProviders: [identityProvider],
        };

        const result = service._setAssigneeInSubmissionsTable(formData);
        expect(result).toBe(true);
      });
    });

    it('should handle empty identityProviders array', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        enableSubmitterRevision: false,
        identityProviders: [],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });

    it('should handle missing identityProviders', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        enableSubmitterRevision: false,
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });

    // New tests for enableSubmitterRevision logic
    it('should return true when enableSubmitterRevision is true and enableStatusUpdates is false', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: false,
        enableSubmitterRevision: true,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });

    it('should return true when enableStatusUpdates is true and enableSubmitterRevision is false', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        enableSubmitterRevision: false,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });

    it('should return true when both enableStatusUpdates and enableSubmitterRevision are true', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        enableSubmitterRevision: true,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });

    it('should return false when both enableStatusUpdates and enableSubmitterRevision are false', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: false,
        enableSubmitterRevision: false,
        identityProviders: [{ code: 'idir' }],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(false);
    });

    it('should return true when enableSubmitterRevision is true regardless of identity provider', () => {
      const testCases = [{ code: 'public' }, { code: 'idir' }, { code: 'bceid' }, { code: 'bceidbusiness' }];

      testCases.forEach((identityProvider) => {
        const formData = {
          showAssigneeInSubmissionsTable: true,
          enableStatusUpdates: false,
          enableSubmitterRevision: true,
          identityProviders: [identityProvider],
        };

        const result = service._setAssigneeInSubmissionsTable(formData);
        expect(result).toBe(true);
      });
    });

    it('should return true when enableSubmitterRevision is true with empty identityProviders array', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: false,
        enableSubmitterRevision: true,
        identityProviders: [],
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });

    it('should return true when enableSubmitterRevision is true with missing identityProviders', () => {
      const formData = {
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: false,
        enableSubmitterRevision: true,
      };

      const result = service._setAssigneeInSubmissionsTable(formData);
      expect(result).toBe(true);
    });
  });
  describe('createForm with assignee validation', () => {
    beforeEach(() => {
      MockModel.mockReset();
      MockTransaction.mockReset();
      resetModels();

      service.validateScheduleObject = jest.fn().mockReturnValue({ status: 'success' });
      formMetadataService.upsert = jest.fn().mockResolvedValue();
      eventStreamConfigService.upsert = jest.fn().mockResolvedValue();

      const mockCreatedForm = {
        id: formId,
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        versions: [],
        showAssigneeInSubmissionsTable: false,
      };

      Form.insert.mockResolvedValue(mockCreatedForm);
      service.readForm = jest.fn().mockResolvedValue(mockCreatedForm);
    });

    it('should allow assignee setting for any form type when conditions are met', async () => {
      const data = {
        name: 'Test Form',
        identityProviders: [{ code: 'public' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: true,
        schema: { components: [] },
      };

      const result = await service.createForm(data, currentUser);

      expect(result).toBeDefined();
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should set assignee to true when conditions met', async () => {
      const data = {
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: true,
        schema: { components: [] },
      };

      const result = await service.createForm(data, currentUser);

      expect(result).toBeDefined();
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should allow assignee setting to be false', async () => {
      const data = {
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
        schema: { components: [] },
      };

      const result = await service.createForm(data, currentUser);

      expect(result).toBeDefined();
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateForm with assignee validation', () => {
    beforeEach(() => {
      MockModel.mockReset();
      MockTransaction.mockReset();
      resetModels();

      service.validateScheduleObject = jest.fn().mockReturnValue({ status: 'success' });
      formMetadataService.upsert = jest.fn().mockResolvedValue();
      eventStreamConfigService.upsert = jest.fn().mockResolvedValue();
    });

    it('should allow assignee setting for any form type', async () => {
      const mockExistingForm = {
        id: formId,
        name: 'Test Form',
        identityProviders: [{ code: 'public' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: true,
      };

      service.readForm = jest.fn().mockResolvedValue(mockExistingForm);

      const updateData = {
        name: 'Test Form',
        identityProviders: [{ code: 'public' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: true,
      };

      const result = await service.updateForm(formId, updateData, currentUser);

      expect(result).toBeDefined();
      expect(service.readForm).toHaveBeenCalledWith(formId);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle non-public forms correctly', async () => {
      const mockExistingForm = {
        id: formId,
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
      };

      service.readForm = jest.fn().mockResolvedValue(mockExistingForm);

      const updateData = {
        name: 'Updated Form',
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        identityProviders: [{ code: 'idir' }],
      };

      await service.updateForm(formId, updateData, currentUser);

      expect(service.readForm).toHaveBeenCalledWith(formId);
      expect(formMetadataService.upsert).toHaveBeenCalledTimes(1);
      expect(eventStreamConfigService.upsert).toHaveBeenCalledTimes(1);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });
  });
});

describe('readFormOptions', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should map idpHints to array of codes in readFormOptions', async () => {
    Form.query = jest.fn().mockReturnThis();
    Form.findById = jest.fn().mockReturnThis();
    Form.modify = jest.fn().mockReturnThis();
    Form.select = jest.fn().mockReturnThis();
    Form.allowGraph = jest.fn().mockReturnThis();
    Form.withGraphFetched = jest.fn().mockReturnThis();
    Form.throwIfNotFound = jest.fn().mockResolvedValue({
      id: formId,
      idpHints: [{ idp: 'idir' }, { idp: 'bceid' }],
    });

    const result = await service.readFormOptions(formId);
    expect(result.idpHints).toEqual(['idir', 'bceid']);
  });
});

describe('listFormSubmission helpers', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should filter by assignee if shouldIncludeAssignee and filterAssignedToCurrentUser', () => {
    const query = { where: jest.fn().mockReturnThis(), modify: jest.fn().mockReturnThis() };
    SubmissionMetadata.query = jest.fn().mockReturnValue(query);

    const params = { filterAssignedToCurrentUser: true };
    const currentUser = { id: 'user-id' };
    service._initFormSubmissionsListQuery(formId, params, currentUser, true);

    expect(query.where).toHaveBeenCalledWith('formSubmissionAssignedToUserId', 'user-id');
  });
  it('should return true for _shouldIncludeAssignee when all conditions met', () => {
    const form = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: true, identityProviders: [{ code: 'idir' }] };
    expect(service._shouldIncludeAssignee(form)).toBe(true);
  });

  it('should return true for _shouldIncludeAssignee when public and conditions met', () => {
    const form = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: true, identityProviders: [{ code: 'public' }] };
    expect(service._shouldIncludeAssignee(form)).toBe(true);
  });
  it('should always include lateEntry in fields from _buildSelectionAndFields', () => {
    const params = { fields: ['field1', 'updatedAt', 'updatedBy', 'assignee'] };
    const { fields } = service._buildSelectionAndFields(params, true);
    expect(fields).toContain('lateEntry');
  });
  it('should remove sortBy if column not in selection or fields', () => {
    const params = { sortBy: { column: 'notAColumn' } };
    service._validateSortBy(params, ['a'], ['b']);
    expect(params.sortBy).toBeUndefined();
  });
});

describe('publishVersion', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should rollback and throw if publishVersion fails', async () => {
    service.readForm = jest.fn().mockResolvedValue({ id: formId });
    FormVersion.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormVersion.query = jest.fn().mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(service.publishVersion(formId, 'verId', currentUser, {})).rejects.toThrow('DB error');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });
});

describe('publishDraft', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should rollback and throw if publishDraft fails', async () => {
    service.readForm = jest.fn().mockResolvedValue({ id: formId, versions: [] });
    service.readDraft = jest.fn().mockResolvedValue({ id: 'draftId', schema: {} });
    FormVersionDraft.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormVersion.query = jest.fn().mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(service.publishDraft(formId, 'draftId', currentUser)).rejects.toThrow('DB error');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });
});

describe('extra coverage', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle missing form property in popFormLevelInfo', () => {
    const submissions = [{ simplenumber: 123 }];
    const result = service.popFormLevelInfo(submissions);
    expect(result).toEqual([{ simplenumber: 123 }]);
  });

  it('should throw 400 if filesApiAccess is not boolean', async () => {
    await expect(service.filesApiKeyAccess(formId, 'notBoolean')).rejects.toThrow('filesApiAccess must be a boolean');
  });
});
describe('createMultiSubmission', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create multiple submissions and commit transaction', async () => {
    // Arrange
    const formVersionId = uuid.v4();
    const formVersion = { id: formVersionId, formId: formId };
    const form = {
      formId: formId,
      id: formId,
      identityProviders: [{ code: 'idir' }],
      enableSubmitterDraft: true,
      allowSubmitterToUploadFile: true,
    };
    const currentUserLocal = { ...currentUser, public: false };
    const submissionDataArray = [{ foo: 1 }, { bar: 2 }];
    const data = {
      submission: { data: submissionDataArray },
      draft: true,
    };

    service.readVersion = jest.fn().mockResolvedValue(formVersion);
    service.readForm = jest.fn().mockResolvedValue(form);
    service.popFormLevelInfo = jest.fn((arr) => arr);
    FormSubmission.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormSubmission.query = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue([{ id: uuid.v4() }, { id: uuid.v4() }]),
    });
    FormSubmissionUser.query = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue(true),
    });

    // Act
    const result = await service.createMultiSubmission(formVersionId, data, currentUserLocal);

    // Assert
    expect(service.readVersion).toHaveBeenCalledWith(formVersionId);
    expect(service.readForm).toHaveBeenCalledWith(form.formId);
    expect(FormSubmission.startTransaction).toHaveBeenCalled();
    expect(FormSubmission.query).toHaveBeenCalledWith(MockTransaction);
    expect(FormSubmissionUser.query).toHaveBeenCalledWith(MockTransaction);
    expect(MockTransaction.commit).toHaveBeenCalled();
    expect(result.length).toBe(2);
  });

  it('should throw 401 if enableSubmitterDraft is false', async () => {
    const formVersionId = uuid.v4();
    const formVersion = { id: formVersionId, formId: formId };
    const form = {
      formId: formId,
      id: formId,
      identityProviders: [{ code: 'idir' }],
      enableSubmitterDraft: false,
      allowSubmitterToUploadFile: true,
    };
    const data = { submission: { data: [{}] } };

    service.readVersion = jest.fn().mockResolvedValue(formVersion);
    service.readForm = jest.fn().mockResolvedValue(form);

    await expect(service.createMultiSubmission(formVersionId, data, currentUser)).rejects.toThrow('This form is not allowed to save draft.');
  });

  it('should throw 401 if allowSubmitterToUploadFile is false', async () => {
    const formVersionId = uuid.v4();
    const formVersion = { id: formVersionId, formId: formId };
    const form = {
      formId: formId,
      id: formId,
      identityProviders: [{ code: 'idir' }],
      enableSubmitterDraft: true,
      allowSubmitterToUploadFile: false,
    };
    const data = { submission: { data: [{}] } };

    service.readVersion = jest.fn().mockResolvedValue(formVersion);
    service.readForm = jest.fn().mockResolvedValue(form);

    await expect(service.createMultiSubmission(formVersionId, data, currentUser)).rejects.toThrow('This form is not allowed for multi draft upload.');
  });

  it('should throw 401 if form is public', async () => {
    const formVersionId = uuid.v4();
    const formVersion = { id: formVersionId, formId: formId };
    const form = {
      formId: formId,
      id: formId,
      identityProviders: [{ code: 'public' }],
      enableSubmitterDraft: true,
      allowSubmitterToUploadFile: true,
    };
    const data = { submission: { data: [{}] } };

    service.readVersion = jest.fn().mockResolvedValue(formVersion);
    service.readForm = jest.fn().mockResolvedValue(form);

    await expect(service.createMultiSubmission(formVersionId, data, currentUser)).rejects.toThrow('This operation is not allowed to public.');
  });

  it('should rollback transaction if an error occurs during insert', async () => {
    const formVersionId = uuid.v4();
    const formVersion = { id: formVersionId, formId: formId };
    const form = {
      formId: formId,
      id: formId,
      identityProviders: [{ code: 'idir' }],
      enableSubmitterDraft: true,
      allowSubmitterToUploadFile: true,
    };
    const currentUserLocal = { ...currentUser, public: false };
    const submissionDataArray = [{ foo: 1 }, { bar: 2 }];
    const data = {
      submission: { data: submissionDataArray },
      draft: true,
    };

    service.readVersion = jest.fn().mockResolvedValue(formVersion);
    service.readForm = jest.fn().mockResolvedValue(form);
    service.popFormLevelInfo = jest.fn((arr) => arr);
    FormSubmission.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormSubmission.query = jest.fn().mockReturnValue({
      insert: jest.fn().mockRejectedValue(new Error('Insert failed')),
    });

    await expect(service.createMultiSubmission(formVersionId, data, currentUserLocal)).rejects.toThrow('Insert failed');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });

  it('should throw if submission data is not an array', async () => {
    const formVersionId = uuid.v4();
    const formVersion = { id: formVersionId, formId: formId };
    const form = {
      formId: formId,
      id: formId,
      identityProviders: [{ code: 'idir' }],
      enableSubmitterDraft: true,
      allowSubmitterToUploadFile: true,
    };
    const data = { submission: { data: null } };

    service.readVersion = jest.fn().mockResolvedValue(formVersion);
    service.readForm = jest.fn().mockResolvedValue(form);

    await expect(service.createMultiSubmission(formVersionId, data, currentUser)).rejects.toThrow();
  });
});

describe('API Key management', () => {
  beforeEach(() => {
    MockModel.mockReset();
    MockTransaction.mockReset();
    resetModels();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should read an API key', async () => {
    const apiKey = { id: formId, formId, secret: 'secret', filesApiAccess: false };

    // Create a chainable mock object
    const chain = {
      modify: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(apiKey),
    };
    // Mock FormApiKey.query to return the chainable object
    FormApiKey.query = jest.fn(() => chain);

    const result = await service.readApiKey(formId);

    expect(FormApiKey.query).toHaveBeenCalled();
    expect(chain.modify).toHaveBeenCalledWith('filterFormId', formId);
    expect(chain.first).toHaveBeenCalled();
    expect(result).toEqual(apiKey);
  });

  it('should create a new API key if none exists', async () => {
    const newKey = { id: formId, secret: 'newsecret' };
    // First call: no key, Second call: new key
    service.readApiKey = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(newKey);

    FormApiKey.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormApiKey.query = jest.fn(() => ({
      insert: jest.fn().mockResolvedValue(newKey),
    }));

    const result = await service.createOrReplaceApiKey(formId, currentUser);

    expect(service.readApiKey).toHaveBeenCalledTimes(2);
    expect(FormApiKey.startTransaction).toHaveBeenCalled();
    expect(FormApiKey.query).toHaveBeenCalledWith(MockTransaction);
    expect(MockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual(newKey);
  });

  it('should replace an existing API key', async () => {
    const oldKey = { id: formId, secret: 'oldsecret' };
    const updatedKey = { id: formId, secret: 'newsecret' };
    // First call: old key, Second call: updated key
    service.readApiKey = jest.fn().mockResolvedValueOnce(oldKey).mockResolvedValueOnce(updatedKey);

    FormApiKey.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    const mockUpdate = jest.fn().mockResolvedValue(updatedKey);
    const chain = {
      modify: jest.fn().mockReturnThis(),
      update: mockUpdate,
    };
    FormApiKey.query = jest.fn(() => chain);

    const result = await service.createOrReplaceApiKey(formId, currentUser);

    expect(service.readApiKey).toHaveBeenCalledTimes(2);
    expect(FormApiKey.startTransaction).toHaveBeenCalled();
    expect(FormApiKey.query).toHaveBeenCalledWith(MockTransaction);
    expect(chain.modify).toHaveBeenCalledWith('filterFormId', formId);
    expect(mockUpdate).toHaveBeenCalled();
    expect(MockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual(updatedKey);
  });

  it('should delete an API key', async () => {
    // Mock readApiKey to return a key with an id
    service.readApiKey = jest.fn().mockResolvedValue({ id: formId, secret: 'secret' });

    const chain = {
      deleteById: jest.fn().mockReturnThis(),
      throwIfNotFound: jest.fn().mockResolvedValue({ id: formId, apiKey: null }),
    };
    FormApiKey.query = jest.fn(() => chain);

    const result = await service.deleteApiKey(formId);

    expect(service.readApiKey).toHaveBeenCalledWith(formId);
    expect(chain.deleteById).toHaveBeenCalledWith(formId);
    expect(chain.throwIfNotFound).toHaveBeenCalled();
    expect(result.apiKey).toBeNull();
  });

  it('should rollback if createOrReplaceApiKey insert fails', async () => {
    service.readApiKey = jest.fn().mockResolvedValueOnce(null); // triggers insert branch
    FormApiKey.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormApiKey.query = jest.fn(() => ({
      insert: jest.fn().mockRejectedValue(new Error('fail')),
    }));

    await expect(service.createOrReplaceApiKey(formId, currentUser)).rejects.toThrow('fail');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });

  it('should rollback if createOrReplaceApiKey update fails', async () => {
    service.readApiKey = jest.fn().mockResolvedValueOnce({ id: formId, secret: 'oldsecret' });
    FormApiKey.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormApiKey.query = jest.fn(() => ({
      modify: jest.fn().mockReturnThis(),
      update: jest.fn().mockRejectedValue(new Error('fail')),
    }));

    await expect(service.createOrReplaceApiKey(formId, currentUser)).rejects.toThrow('fail');
    expect(MockTransaction.rollback).toHaveBeenCalled();
  });

  it('should rollback if deleteApiKey fails', async () => {
    // Mock readApiKey to return a key with an id
    service.readApiKey = jest.fn().mockResolvedValue({ id: formId, secret: 'secret' });

    const chain = {
      deleteById: jest.fn().mockReturnThis(),
      throwIfNotFound: jest.fn().mockRejectedValue(new Error('fail')),
    };
    FormApiKey.query = jest.fn(() => chain);

    await expect(service.deleteApiKey(formId)).rejects.toThrow('fail');
  });
});

describe('Branch coverage for assignee and selection helpers', () => {
  describe('_setAssigneeInSubmissionsTable', () => {
    it('returns false if showAssigneeInSubmissionsTable is missing', () => {
      const formData = { enableStatusUpdates: true, identityProviders: [{ code: 'idir' }] };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(false);
    });

    it('returns false if enableStatusUpdates is false', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: false, enableSubmitterRevision: false, identityProviders: [{ code: 'idir' }] };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(false);
    });

    it('returns true if identityProviders includes public', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: true, identityProviders: [{ code: 'public' }] };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(true);
    });

    it('returns true if all conditions met and identityProviders is missing', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: true };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(true);
    });

    // New tests for enableSubmitterRevision logic
    it('returns true if enableSubmitterRevision is true and enableStatusUpdates is false', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: false, enableSubmitterRevision: true, identityProviders: [{ code: 'idir' }] };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(true);
    });

    it('returns false if both enableStatusUpdates and enableSubmitterRevision are false', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: false, enableSubmitterRevision: false, identityProviders: [{ code: 'idir' }] };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(false);
    });

    it('returns true if enableSubmitterRevision is true and identityProviders includes public', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: false, enableSubmitterRevision: true, identityProviders: [{ code: 'public' }] };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(true);
    });

    it('returns true if enableSubmitterRevision is true and identityProviders is missing', () => {
      const formData = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: false, enableSubmitterRevision: true };
      expect(service._setAssigneeInSubmissionsTable(formData)).toBe(true);
    });
  });

  describe('_shouldIncludeAssignee', () => {
    it('returns false if showAssigneeInSubmissionsTable is false', () => {
      const form = { showAssigneeInSubmissionsTable: false, enableStatusUpdates: true, identityProviders: [{ code: 'idir' }] };
      expect(service._shouldIncludeAssignee(form)).toBe(false);
    });

    it('returns false if enableStatusUpdates is false', () => {
      const form = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: false, enableSubmitterRevision: false, identityProviders: [{ code: 'idir' }] };
      expect(service._shouldIncludeAssignee(form)).toBe(false);
    });

    it('returns true if identityProviders includes public', () => {
      const form = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: true, identityProviders: [{ code: 'public' }] };
      expect(service._shouldIncludeAssignee(form)).toBe(true);
    });

    it('returns true if all conditions met', () => {
      const form = { showAssigneeInSubmissionsTable: true, enableStatusUpdates: true, identityProviders: [{ code: 'idir' }] };
      expect(service._shouldIncludeAssignee(form)).toBe(true);
    });
  });

  describe('_buildSelectionAndFields', () => {
    it('includes updatedAt and updatedBy in selection if present in fields', () => {
      const params = { fields: ['updatedAt', 'updatedBy', 'foo'] };
      const { selection } = service._buildSelectionAndFields(params, false);
      expect(selection).toEqual(expect.arrayContaining(['updatedAt', 'updatedBy']));
    });

    it('filters out updatedAt, updatedBy, and empty string from fields', () => {
      const params = { fields: ['updatedAt', 'updatedBy', '', 'foo'] };
      const { fields } = service._buildSelectionAndFields(params, false);
      expect(fields).toEqual(expect.arrayContaining(['foo', 'lateEntry']));
      expect(fields).not.toEqual(expect.arrayContaining(['updatedAt', 'updatedBy', '']));
    });

    it('filters out assignee from fields if shouldIncludeAssignee is true', () => {
      const params = { fields: ['assignee', 'foo'] };
      const { fields } = service._buildSelectionAndFields(params, true);
      expect(fields).not.toContain('assignee');
      expect(fields).toContain('foo');
      expect(fields).toContain('lateEntry');
    });

    it('handles fields as a comma-separated string', () => {
      const params = { fields: 'foo,bar,updatedAt' };
      const { selection, fields } = service._buildSelectionAndFields(params, false);
      expect(selection).toContain('updatedAt');
      expect(fields).toEqual(expect.arrayContaining(['foo', 'bar', 'lateEntry']));
    });
  });

  describe('_validateSortBy', () => {
    it('does not throw if sortBy.column is in selection', () => {
      const params = { sortBy: { column: 'foo' } };
      expect(() => service._validateSortBy(params, ['foo'], ['bar'])).not.toThrow();
      expect(params.sortBy).toBeDefined();
    });

    it('does not throw if sortBy.column is in fields', () => {
      const params = { sortBy: { column: 'bar' } };
      expect(() => service._validateSortBy(params, ['foo'], ['bar'])).not.toThrow();
      expect(params.sortBy).toBeDefined();
    });

    it('does not throw if sortBy.column is not in selection or fields, removes sortBy', () => {
      const params = { sortBy: { column: 'baz' } };
      expect(params.sortBy).toBeDefined();
      expect(() => service._validateSortBy(params, ['foo'], ['bar'])).not.toThrow();
      expect(params.sortBy).toBeUndefined();
    });

    it('does not throw if sortBy is missing, removes sortBy', () => {
      const params = {};
      expect(params.sortBy).toBeUndefined();
      expect(() => service._validateSortBy(params, ['foo'], ['bar'])).not.toThrow();
      expect(params.sortBy).toBeUndefined();
    });
  });
});

describe('processPaginationData', () => {
  const mockQuery = {
    page: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter by string (isStringLike)', async () => {
    const data = [
      { foo: 'Bar', submissionId: 1, formVersionId: 1, formId: 1 },
      { foo: 'baz', submissionId: 2, formVersionId: 2, formId: 2 },
    ];
    const query = Promise.resolve(data);
    const result = await service.processPaginationData(query, 0, 10, 2, 'bar', true);
    expect(result.results.length).toBe(1);
    expect(result.results[0].foo).toBe('Bar');
  });

  it('should filter by number (isNumberLike)', async () => {
    const data = [
      { foo: 123, submissionId: 1, formVersionId: 1, formId: 1 },
      { foo: 456, submissionId: 2, formVersionId: 2, formId: 2 },
    ];
    const query = Promise.resolve(data);
    const result = await service.processPaginationData(query, 0, 10, 2, 123, true);
    expect(result.results.length).toBe(1);
    expect(result.results[0].foo).toBe(123);
  });

  it('should filter by date (isDateLike)', async () => {
    const data = [
      { foo: '2023-08-19T19:11:00Z', submissionId: 1, formVersionId: 1, formId: 1 },
      { foo: '2022-01-01T00:00:00Z', submissionId: 2, formVersionId: 2, formId: 2 },
    ];
    const query = Promise.resolve(data);
    const result = await service.processPaginationData(query, 0, 10, 2, '2023-08-19', true);
    expect(result.results.length).toBe(1);
    expect(result.results[0].foo).toContain('2023-08-19');
  });

  it('should skip array/object fields in search', async () => {
    const data = [
      { foo: ['bar'], bar: { baz: 1 }, submissionId: 1, formVersionId: 1, formId: 1 },
      { foo: 'baz', submissionId: 2, formVersionId: 2, formId: 2 },
    ];
    const query = Promise.resolve(data);
    const result = await service.processPaginationData(query, 0, 10, 2, 'baz', true);
    expect(result.results.length).toBe(1);
    expect(result.results[0].foo).toBe('baz');
  });

  it('should return all results when itemsPerPage is -1 (no search)', async () => {
    const query = Promise.resolve({ results: [1, 2, 3], total: 3 });
    const result = await service.processPaginationData(query, 0, -1, 3, null, false);
    expect(result.results).toEqual([1, 2, 3]);
    expect(result.total).toBe(3);
  });

  it('should return paginated results when itemsPerPage is set and page is valid (no search)', async () => {
    mockQuery.page.mockResolvedValue({ results: [4, 5], total: 2 });
    const result = await service.processPaginationData(mockQuery, 1, 2, null, null, false);
    expect(mockQuery.page).toHaveBeenCalledWith(1, 2);
    expect(result.results).toEqual([4, 5]);
    expect(result.total).toBe(2);
  });

  it('should return empty results if no search match', async () => {
    const data = [
      { foo: 'bar', submissionId: 1, formVersionId: 1, formId: 1 },
      { foo: 'baz', submissionId: 2, formVersionId: 2, formId: 2 },
    ];
    const query = Promise.resolve(data);
    const result = await service.processPaginationData(query, 0, 10, 2, 'notfound', true);
    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should handle searchEnabled as string "true"', async () => {
    const data = [
      { foo: 'bar', submissionId: 1, formVersionId: 1, formId: 1 },
      { foo: 'baz', submissionId: 2, formVersionId: 2, formId: 2 },
    ];
    const query = Promise.resolve(data);
    const result = await service.processPaginationData(query, 0, 10, 2, 'bar', 'true');
    expect(result.results.length).toBe(1);
    expect(result.results[0].foo).toBe('bar');
  });

  it('should handle falsy searchEnabled and return paged results', async () => {
    mockQuery.page.mockResolvedValue({ results: [1, 2], total: 2 });
    const result = await service.processPaginationData(mockQuery, 0, 2, null, null, undefined);
    expect(result.results).toEqual([1, 2]);
    expect(result.total).toBe(2);
  });
});

describe('filesApiKeyAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw 400 if filesApiAccess is not boolean', async () => {
    await expect(service.filesApiKeyAccess('formId', 'notBoolean')).rejects.toThrow('filesApiAccess must be a boolean');
  });

  it('should throw 404 if no API key exists', async () => {
    service.readApiKey = jest.fn().mockResolvedValue(null);
    await expect(service.filesApiKeyAccess('formId', true)).rejects.toThrow('No API key found');
  });

  it('should update filesApiAccess if API key exists', async () => {
    const apiKey = { id: 'keyId', formId: 'formId', filesApiAccess: false };
    service.readApiKey = jest.fn().mockResolvedValue(apiKey);
    FormApiKey.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    const chain = {
      modify: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue({ ...apiKey, filesApiAccess: true }),
    };
    FormApiKey.query = jest.fn(() => chain);

    service.readApiKey.mockResolvedValueOnce(apiKey).mockResolvedValueOnce({ ...apiKey, filesApiAccess: true });

    const result = await service.filesApiKeyAccess('formId', true);
    expect(FormApiKey.startTransaction).toHaveBeenCalled();
    expect(FormApiKey.query).toHaveBeenCalledWith(MockTransaction);
    expect(chain.modify).toHaveBeenCalledWith('filterFormId', 'formId');
    expect(chain.update).toHaveBeenCalledWith({
      formId: 'formId',
      filesApiAccess: true,
    });
    expect(result.filesApiAccess).toBe(true);
  });
});

describe('createOrUpdateSubscriptionDetails', () => {
  let currentUser;
  beforeEach(() => {
    currentUser = { usernameIdp: 'user@idir' };
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should insert new subscription details if none exist', async () => {
    service.readFormSubscriptionDetails = jest
      .fn()
      .mockResolvedValueOnce(null) // first call: no details exist
      .mockResolvedValueOnce({ id: 'subId', foo: 'bar' }); // second call: after insert

    FormSubscription.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormSubscription.query = jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ id: 'subId', foo: 'bar' }),
    }));

    const result = await service.createOrUpdateSubscriptionDetails('formId', { foo: 'bar' }, currentUser);
    expect(FormSubscription.startTransaction).toHaveBeenCalled();
    expect(FormSubscription.query).toHaveBeenCalledWith(MockTransaction);
    expect(result).toEqual({ id: 'subId', foo: 'bar' });
  });

  it('should update subscription details if they exist', async () => {
    const existing = { id: 'subId', eventStreamNotifications: ['a'] };
    service.readFormSubscriptionDetails = jest
      .fn()
      .mockResolvedValueOnce(existing) // first call: details exist
      .mockResolvedValueOnce({ ...existing, foo: 'baz' }); // second call: after update

    FormSubscription.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    const mockUpdate = jest.fn().mockResolvedValue({ ...existing, foo: 'baz' });
    FormSubscription.query = jest.fn(() => ({
      modify: jest.fn().mockReturnThis(),
      update: mockUpdate,
    }));

    const result = await service.createOrUpdateSubscriptionDetails('formId', { foo: 'baz' }, currentUser);
    expect(FormSubscription.startTransaction).toHaveBeenCalled();
    expect(FormSubscription.query).toHaveBeenCalledWith(MockTransaction);
    expect(result).toEqual({ ...existing, foo: 'baz' });
  });

  it('should handle empty subscriptionData and insert', async () => {
    service.readFormSubscriptionDetails = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'subId' });

    FormSubscription.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    FormSubscription.query = jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ id: 'subId' }),
    }));

    const result = await service.createOrUpdateSubscriptionDetails('formId', {}, currentUser);
    expect(result).toEqual({ id: 'subId' });
  });

  it('should handle update with empty eventStreamNotifications', async () => {
    const existing = { id: 'subId', eventStreamNotifications: [] };
    service.readFormSubscriptionDetails = jest
      .fn()
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce({ ...existing, foo: 'baz' });

    FormSubscription.startTransaction = jest.fn().mockResolvedValue(MockTransaction);
    const mockUpdate = jest.fn().mockResolvedValue({ ...existing, foo: 'baz' });
    FormSubscription.query = jest.fn(() => ({
      modify: jest.fn().mockReturnThis(),
      update: mockUpdate,
    }));

    const result = await service.createOrUpdateSubscriptionDetails('formId', { foo: 'baz' }, currentUser);
    expect(result).toEqual({ ...existing, foo: 'baz' });
  });

  it('should rollback if insert fails', async () => {
    service.readFormSubscriptionDetails = jest.fn().mockResolvedValue(null);
    const mockTrx = { rollback: jest.fn() };
    FormSubscription.startTransaction = jest.fn().mockResolvedValue(mockTrx);
    FormSubscription.query = jest.fn(() => ({
      insert: jest.fn().mockRejectedValue(new Error('fail')),
    }));

    await expect(service.createOrUpdateSubscriptionDetails('formId', { foo: 'bar' }, currentUser)).rejects.toThrow('fail');
    expect(mockTrx.rollback).toHaveBeenCalled();
  });

  it('should rollback if update fails', async () => {
    const existing = { id: 'subId', eventStreamNotifications: ['a'] };
    service.readFormSubscriptionDetails = jest.fn().mockResolvedValue(existing);
    const mockTrx = { rollback: jest.fn() };
    FormSubscription.startTransaction = jest.fn().mockResolvedValue(mockTrx);
    FormSubscription.query = jest.fn(() => ({
      modify: jest.fn().mockReturnThis(),
      update: jest.fn().mockRejectedValue(new Error('fail')),
    }));

    await expect(service.createOrUpdateSubscriptionDetails('formId', { foo: 'baz' }, currentUser)).rejects.toThrow('fail');
    expect(mockTrx.rollback).toHaveBeenCalled();
  });

  it('should throw if formId is missing', async () => {
    await expect(service.createOrUpdateSubscriptionDetails(undefined, { foo: 'bar' }, currentUser)).rejects.toThrow();
  });

  it('should throw if currentUser is missing', async () => {
    await expect(service.createOrUpdateSubscriptionDetails('formId', { foo: 'bar' }, undefined)).rejects.toThrow();
  });
});

describe('getFCProactiveHelpImageUrl', () => {
  it('should return image url if item exists', async () => {
    const mockResult = [
      {
        imageType: 'image/png',
        image: 'base64string',
      },
    ];
    FormComponentsProactiveHelp.query = jest.fn(() => ({
      modify: jest.fn().mockResolvedValue(mockResult),
    }));
    // Patch the query().modify() chain to resolve to mockResult
    FormComponentsProactiveHelp.query = jest.fn().mockReturnValue({
      modify: jest.fn().mockResolvedValue(mockResult),
    });

    const result = await service.getFCProactiveHelpImageUrl('componentId');
    expect(result.url).toContain('data:image/png;base64,base64string');
  });

  it('should return empty url if no item exists', async () => {
    FormComponentsProactiveHelp.query = jest.fn().mockReturnValue({
      modify: jest.fn().mockResolvedValue([]),
    });

    const result = await service.getFCProactiveHelpImageUrl('componentId');
    expect(result.url).toBe('');
  });
});

describe('listFormComponentsProactiveHelp', () => {
  it('should return grouped help info if results exist', async () => {
    const mockResult = [
      {
        id: '1',
        publishStatus: 'published',
        componentName: 'compA',
        externalLink: 'http://example.com',
        version: '1.0',
        groupName: 'group1',
        description: 'desc',
        isLinkEnabled: true,
        componentImageName: 'imgA.png',
      },
      {
        id: '2',
        publishStatus: 'published',
        componentName: 'compB',
        externalLink: 'http://example.com',
        version: '1.0',
        groupName: 'group2',
        description: 'desc',
        isLinkEnabled: false,
        componentImageName: 'imgB.png',
      },
      {
        id: '3',
        publishStatus: 'published',
        componentName: 'compC',
        externalLink: 'http://example.com',
        version: '1.0',
        groupName: 'group1',
        description: 'desc',
        isLinkEnabled: true,
        componentImageName: 'imgC.png',
      },
    ];
    FormComponentsProactiveHelp.query = jest.fn().mockReturnValue({
      modify: jest.fn().mockResolvedValue(mockResult),
    });

    const result = await service.listFormComponentsProactiveHelp();
    expect(result.group1.length).toBe(2);
    expect(result.group2.length).toBe(1);
    expect(result.group1[0].componentName).toBe('compA');
    expect(result.group1[1].componentName).toBe('compC');
    expect(result.group2[0].componentName).toBe('compB');
  });

  it('should return empty object if no results', async () => {
    FormComponentsProactiveHelp.query = jest.fn().mockReturnValue({
      modify: jest.fn().mockResolvedValue([]),
    });

    const result = await service.listFormComponentsProactiveHelp();
    expect(result).toEqual({});
  });
});

describe('_setAllowSubmitterToUploadFile', () => {
  it('returns true if identityProviders does not include public', () => {
    const formData = {
      identityProviders: [{ code: 'idir' }],
      allowSubmitterToUploadFile: true,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(true);
  });

  it('returns false if identityProviders includes public and allowSubmitterToUploadFile is truthy', () => {
    const formData = {
      identityProviders: [{ code: 'public' }],
      allowSubmitterToUploadFile: true,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(false);
  });

  it('returns false if allowSubmitterToUploadFile is false', () => {
    const formData = {
      identityProviders: [{ code: 'idir' }],
      allowSubmitterToUploadFile: false,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(false);
  });

  it('returns true if identityProviders is missing (team protected) and allow is true', () => {
    const formData = {
      allowSubmitterToUploadFile: true,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(true);
  });

  it('returns false if identityProviders is missing (team protected) and allow is false', () => {
    const formData = {
      allowSubmitterToUploadFile: false,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(false);
  });

  it('returns true if identityProviders is empty and allow is true', () => {
    const formData = {
      identityProviders: [],
      allowSubmitterToUploadFile: true,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(true);
  });

  it('returns false if identityProviders is empty and allow is false', () => {
    const formData = {
      identityProviders: [],
      allowSubmitterToUploadFile: false,
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(false);
  });

  it('returns false if allowSubmitterToUploadFile is missing', () => {
    const formData = {
      identityProviders: [{ code: 'idir' }],
    };
    expect(service._setAllowSubmitterToUploadFile(formData)).toBe(false);
  });
});
