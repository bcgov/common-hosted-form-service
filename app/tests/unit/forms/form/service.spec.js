const { MockModel, MockTransaction } = require('../../../common/dbHelper');

const { v4: uuidv4 } = require('uuid');

const { EmailTypes } = require('../../../../src/forms/common/constants');
const service = require('../../../../src/forms/form/service');

jest.mock('../../../../src/forms/common/models/tables/documentTemplate', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formEmailTemplate', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/submissionMetadata', () => MockModel);

const documentTemplateId = uuidv4();
const formId = uuidv4();

const currentUser = {
  usernameIdp: 'TESTER',
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

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

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

  it('should not error if fields has a trailing commma', async () => {
    await service.listFormSubmissions(formId, { fields: 'x,' });

    expect(MockModel.select).toBeCalledTimes(1);
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

describe('_getDefaultEmailTemplate', () => {
  it('should return a template', async () => {
    const formId = uuidv4();
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
    const id = uuidv4();
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
    service.readEmailTemplate = jest.fn().mockRejectedValue(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toBeCalledTimes(0);
  });

  it('should rollback when an insert error occurs inside transaction', async () => {
    service.readEmailTemplate = jest.fn().mockReturnValue(emailTemplate);
    service.readEmailTemplates = jest.fn().mockReturnValue([emailTemplate]);
    MockModel.insert = jest.fn().mockRejectedValue(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });

  it('should rollback when an update error occurs inside transaction', async () => {
    const id = uuidv4();
    service.readEmailTemplate = jest.fn().mockReturnValue({ id: id, ...emailTemplate });
    service.readEmailTemplates = jest.fn().mockReturnValue([{ id: id, ...emailTemplate }]);
    MockModel.update = jest.fn().mockRejectedValue(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toBeCalledTimes(1);
  });
});
