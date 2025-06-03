const { MockModel, MockTransaction } = require('../../../common/dbHelper');

const uuid = require('uuid');

const { EmailTypes, ScheduleType } = require('../../../../src/forms/common/constants');
const service = require('../../../../src/forms/form/service');

jest.mock('../../../../src/forms/common/models/tables/documentTemplate', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formEmailTemplate', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/submissionMetadata', () => MockModel);

const { eventStreamService } = require('../../../../src/components/eventStreamService');
const formMetadataService = require('../../../../src/forms/form/formMetadata/service');
const eventStreamConfigService = require('../../../../src/forms/form/eventStreamConfig/service');
const eventService = require('../../../../src/forms//event/eventService');

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
} = require('../../../../src/forms/common/models');

const documentTemplateId = uuid.v4();
const formId = uuid.v4();

const currentUser = {
  usernameIdp: 'TESTER',
  id: uuid.v4(),
};

const documentTemplate = {
  filename: 'cdogs_template.txt',
  formId: formId,
  id: documentTemplateId,
  template: 'My Template',
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

describe('Document Templates', () => {
  describe('documentTemplateCreate', () => {
    // Need to temporarily replace calls to other functions within the module -
    // they will be tested elsewhere.
    beforeEach(() => {
      jest.spyOn(service, 'documentTemplateRead').mockImplementation(() => documentTemplate);
    });

    it('should not roll back transaction create problems', async () => {
      const error = new Error('error');
      MockModel.startTransaction.mockImplementationOnce(() => {
        throw error;
      });

      await expect(service.documentTemplateCreate(formId, documentTemplate, currentUser)).rejects.toThrow(error);

      expect(MockTransaction.commit).toBeCalledTimes(0);
      expect(MockTransaction.rollback).toBeCalledTimes(0);
    });

    it('should propagate database errors', async () => {
      const error = new Error('error');
      MockModel.insert.mockImplementationOnce(() => {
        throw error;
      });

      await expect(service.documentTemplateCreate(formId, documentTemplate, currentUser)).rejects.toThrow(error);

      expect(MockTransaction.commit).toBeCalledTimes(0);
      expect(MockTransaction.rollback).toBeCalledTimes(1);
    });

    it('should update database', async () => {
      MockModel.mockResolvedValue(documentTemplate);
      const newDocumentTemplate = { ...documentTemplate };
      delete newDocumentTemplate.id;

      await service.documentTemplateCreate(formId, newDocumentTemplate, currentUser.usernameIdp);

      expect(MockModel.query).toBeCalledTimes(1);
      expect(MockModel.query).toBeCalledWith(MockTransaction);
      expect(MockModel.insert).toBeCalledTimes(1);
      expect(MockModel.insert).toBeCalledWith(
        expect.objectContaining({
          ...newDocumentTemplate,
          createdBy: currentUser.usernameIdp,
        })
      );
      expect(MockTransaction.commit).toBeCalledTimes(1);
      expect(MockTransaction.rollback).toBeCalledTimes(0);
    });
  });

  describe('documentTemplateDelete', () => {
    it('should not roll back transaction create problems', async () => {
      const error = new Error('error');
      MockModel.startTransaction.mockImplementationOnce(() => {
        throw error;
      });

      await expect(service.documentTemplateDelete(formId, documentTemplate, currentUser)).rejects.toThrow(error);

      expect(MockTransaction.commit).toBeCalledTimes(0);
      expect(MockTransaction.rollback).toBeCalledTimes(0);
    });

    it('should propagate database errors', async () => {
      const error = new Error('error');
      MockModel.patchAndFetchById.mockImplementationOnce(() => {
        throw error;
      });

      await expect(service.documentTemplateDelete(documentTemplateId, currentUser.usernameIdp)).rejects.toThrow(error);

      expect(MockTransaction.commit).toBeCalledTimes(0);
      expect(MockTransaction.rollback).toBeCalledTimes(1);
    });

    it('should update database', async () => {
      MockModel.mockResolvedValue(documentTemplate);

      await service.documentTemplateDelete(documentTemplateId, currentUser.usernameIdp);

      expect(MockModel.query).toBeCalledTimes(1);
      expect(MockModel.query).toBeCalledWith(MockTransaction);
      expect(MockModel.patchAndFetchById).toBeCalledTimes(1);
      expect(MockModel.patchAndFetchById).toBeCalledWith(
        documentTemplateId,
        expect.objectContaining({
          active: false,
          updatedBy: currentUser.usernameIdp,
        })
      );
      expect(MockTransaction.commit).toBeCalledTimes(1);
      expect(MockTransaction.rollback).toBeCalledTimes(0);
    });
  });

  describe('documentTemplateList', () => {
    it('should propagate database errors', async () => {
      const error = new Error('error');
      MockModel.query.mockImplementationOnce(() => {
        throw error;
      });

      expect(service.documentTemplateList).toThrow(error);
    });

    it('should query database', async () => {
      MockModel.mockResolvedValue([documentTemplate]);

      const result = await service.documentTemplateList(formId);

      expect(result).toEqual([documentTemplate]);

      expect(MockModel.query).toBeCalledTimes(1);
      expect(MockModel.query).toBeCalledWith();
      expect(MockModel.modify).toBeCalledTimes(2);
      expect(MockModel.modify).toBeCalledWith('filterActive', true);
      expect(MockModel.modify).toBeCalledWith('filterFormId', formId);
    });
  });

  describe('documentTemplateRead', () => {
    it('should propagate database errors', async () => {
      const error = new Error('error');
      MockModel.query.mockImplementationOnce(() => {
        throw error;
      });

      expect(service.documentTemplateRead).toThrow(error);
    });

    it('should query database', async () => {
      MockModel.mockResolvedValue(documentTemplate);

      const result = await service.documentTemplateRead(documentTemplateId);

      expect(result).toEqual(documentTemplate);

      expect(MockModel.query).toBeCalledTimes(1);
      expect(MockModel.query).toBeCalledWith();
      expect(MockModel.findById).toBeCalledTimes(1);
      expect(MockModel.findById).toBeCalledWith(documentTemplateId);
      expect(MockModel.modify).toBeCalledTimes(1);
      expect(MockModel.modify).toBeCalledWith('filterActive', true);
      expect(MockModel.throwIfNotFound).toBeCalledTimes(1);
    });
  });
});

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

  describe('400 response when', () => {
    test('sort by column not in select', async () => {
      await expect(
        service.listFormSubmissions(formId, {
          sortBy: {
            column: 'x',
          },
        })
      ).rejects.toThrow('400');
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

    // Mock submission metadata query
    MockModel.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return all submissions when filterAssignedToCurrentUser is false', async () => {
    const params = {
      filterAssignedToCurrentUser: false,
      fields: ['field1'],
    };

    await service.listFormSubmissions(formId, params);

    // Check that Form.findById was called (from readForm)
    expect(Form.findById).toHaveBeenCalledWith(formId);

    // Check that MockModel.query was called (from submission metadata query)
    expect(MockModel.query).toHaveBeenCalledTimes(1);
  });

  it('should handle filterAssignedToCurrentUser parameter', async () => {
    const params = {
      filterAssignedToCurrentUser: true,
      fields: ['field1'],
    };

    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
  });

  it('should handle filterAssignedToCurrentUser with different field combinations', async () => {
    const params = {
      filterAssignedToCurrentUser: true,
      fields: ['field1', 'field2'],
      submissionId: 'test-id',
    };

    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledWith('filterSubmissionId', 'test-id');
  });

  it('should include assignee fields when form allows it', async () => {
    // Override the mock to return a form that allows assignee visibility
    const mockFormWithAssignee = {
      id: formId,
      name: 'Test Form',
      showAssigneeInSubmissionsTable: true,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'idir' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockFormWithAssignee);

    const params = { fields: ['field1'] };
    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);
    expect(MockModel.select).toHaveBeenCalledWith(
      expect.arrayContaining(['formSubmissionAssignedToUserId', 'formSubmissionAssignedToUsernameIdp', 'formSubmissionAssignedToEmail']),
      expect.any(Array)
    );
  });

  it('should not include assignee fields for public forms', async () => {
    // Override the mock to return a public form
    const mockPublicForm = {
      id: formId,
      name: 'Test Form',
      showAssigneeInSubmissionsTable: true,
      enableStatusUpdates: true,
      identityProviders: [{ code: 'public' }],
      versions: [],
    };

    Form.throwIfNotFound.mockResolvedValue(mockPublicForm);

    const params = { fields: ['field1'] };
    await service.listFormSubmissions(formId, params);

    expect(Form.findById).toHaveBeenCalledWith(formId);

    // Should NOT include assignee fields for public forms
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

describe('createForm', () => {
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
    await service.createForm(data, currentUser);

    expect(formMetadataService.upsert).toBeCalledTimes(1);
    expect(eventStreamConfigService.upsert).toBeCalledTimes(1);
    expect(MockTransaction.commit).toBeCalledTimes(1);
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
});
describe('Assignee Visibility Feature Tests', () => {
  describe('createForm with assignee validation', () => {
    beforeEach(() => {
      MockModel.mockReset();
      MockTransaction.mockReset();
      resetModels();

      service.validateScheduleObject = jest.fn().mockReturnValue({ status: 'success' });
      formMetadataService.upsert = jest.fn().mockResolvedValue();
      eventStreamConfigService.upsert = jest.fn().mockResolvedValue();

      // Mock the form creation flow - Fix the readForm mock
      const mockCreatedForm = {
        id: formId,
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        versions: [],
      };

      Form.insert.mockResolvedValue(mockCreatedForm);
      // Fix: Mock readForm method instead of relying on throwIfNotFound
      service.readForm = jest.fn().mockResolvedValue(mockCreatedForm);
    });

    it('should validate assignee settings for valid configuration', async () => {
      const data = {
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        schema: { components: [] },
      };

      const result = await service.createForm(data, currentUser);

      expect(service.readForm).toHaveBeenCalledTimes(1);
      expect(formMetadataService.upsert).toHaveBeenCalledTimes(1);
      expect(eventStreamConfigService.upsert).toHaveBeenCalledTimes(1);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    it('should throw error when assignee validation fails', async () => {
      const data = {
        name: 'Test Form',
        identityProviders: [{ code: 'public' }],
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true,
        schema: { components: [] },
      };

      await expect(service.createForm(data, currentUser)).rejects.toThrow('Assignee visibility cannot be enabled for public forms');
    });

    it('should allow assignee setting to be false', async () => {
      const data = {
        name: 'Test Form',
        identityProviders: [{ code: 'public' }],
        showAssigneeInSubmissionsTable: false,
        enableStatusUpdates: false,
        schema: { components: [] },
      };

      const result = await service.createForm(data, currentUser);

      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
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

    it('should validate assignee settings with existing form data', async () => {
      // Mock existing form with IDIR and status updates enabled
      const mockExistingForm = {
        id: formId,
        name: 'Test Form',
        identityProviders: [{ code: 'idir' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
      };

      service.readForm = jest.fn().mockResolvedValue(mockExistingForm);

      // Pass the data object directly instead of assigning to a variable
      await service.updateForm(
        formId,
        {
          name: 'Updated Form',
          showAssigneeInSubmissionsTable: true,
          enableStatusUpdates: true,
          identityProviders: [{ code: 'idir' }],
        },
        currentUser
      );

      expect(service.readForm).toHaveBeenCalledWith(formId);
      expect(formMetadataService.upsert).toHaveBeenCalledTimes(1);
      expect(eventStreamConfigService.upsert).toHaveBeenCalledTimes(1);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should throw error when trying to enable assignee for public form', async () => {
      // Mock public form
      const mockPublicForm = {
        id: formId,
        name: 'Test Form',
        identityProviders: [{ code: 'public' }],
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
      };

      service.readForm = jest.fn().mockResolvedValue(mockPublicForm);

      const data = {
        name: 'Updated Form',
        showAssigneeInSubmissionsTable: true,
        enableStatusUpdates: true, // Make sure status updates are enabled
        identityProviders: [{ code: 'public' }], // Keep the public identity provider
      };

      await expect(service.updateForm(formId, data, currentUser)).rejects.toThrow('Assignee visibility cannot be enabled for public forms');
    });
  });
});
