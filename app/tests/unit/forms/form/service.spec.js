const { MockModel, MockTransaction } = require('../../../common/dbHelper');

const { v4: uuidv4 } = require('uuid');

const { EmailTypes } = require('../../../../src/forms/common/constants');
const service = require('../../../../src/forms/form/service');

jest.mock('../../../../src/forms/common/models/tables/formEmailTemplate', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/submissionMetadata', () => MockModel);

const emailTemplateSubmissionConfirmation = {
  body: 'default submission confirmation body',
  formId: uuidv4(),
  subject: 'default submission confirmation subject',
  title: 'default submission confirmation title',
  type: EmailTypes.SUBMISSION_CONFIRMATION,
};
const emailTemplate = {
  body: 'body',
  formId: uuidv4(),
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

  // Put the MockModel.query back to what it was, so that the tests that follow
  // can run.
  afterAll(() => {
    MockModel.query = jest.fn().mockReturnThis();
  });

  it('fetch first-page data with 10 items per page', async () => {
    MockModel.query.mockImplementation((data) => {
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
    MockModel.query.mockImplementation((data) => {
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
    MockModel.query.mockImplementation((data) => {
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
    MockModel.query.mockImplementation((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 5, 0, '2023-08-19T19:11', true);
    expect(result.results).toHaveLength(3);
    expect(result.total).toEqual(3);
  });
  it('search submission data with pagination base on any value (first page)', async () => {
    MockModel.query.mockImplementation((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 0, 5, 0, 'a', true);
    expect(result.results).toHaveLength(5);
  });
  it('search submission data with pagination base on any value (second page)', async () => {
    MockModel.query.mockImplementation((data) => data);
    let result = await service.processPaginationData(MockModel.query(SubmissionData), 1, 5, 0, 'a', true);
    expect(result.results).toHaveLength(5);
  });
  it('search submission data with pagination base on any value (test for case)', async () => {
    MockModel.query.mockImplementation((data) => data);
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

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(2);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFormId', emailTemplate.formId);
    expect(MockModel.modify).toHaveBeenCalledWith('filterType', emailTemplate.type);
    expect(template).toEqual(emailTemplate);
  });

  it('should return default template when form ID and type not found', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue();

    const template = await service.readEmailTemplate(emailTemplate.formId, emailTemplate.type);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(2);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFormId', emailTemplate.formId);
    expect(MockModel.modify).toHaveBeenCalledWith('filterType', emailTemplate.type);
    expect(template).toEqual(emailTemplateSubmissionConfirmation);
  });
});

describe('readEmailTemplates', () => {
  it('should return template by searching form ID', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue([emailTemplate]);

    const template = await service.readEmailTemplates(emailTemplate.formId);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFormId', emailTemplate.formId);
    expect(template).toEqual([emailTemplate]);
  });

  it('should return default template when form ID not found', async () => {
    service._getDefaultEmailTemplate = jest.fn().mockReturnValue(emailTemplateSubmissionConfirmation);
    MockModel.mockResolvedValue([]);

    const template = await service.readEmailTemplates(emailTemplate.formId);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFormId', emailTemplate.formId);
    expect(template).toEqual([emailTemplateSubmissionConfirmation]);
  });
});

describe('createOrUpdateEmailTemplates', () => {
  const user = { usernameIdp: 'username' };

  it('should create template when it does not exist', async () => {
    service.readEmailTemplate = jest.fn().mockReturnValue(emailTemplate);
    service.readEmailTemplates = jest.fn().mockReturnValue([emailTemplate]);

    await service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user);

    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockModel.insert).toHaveBeenCalledWith({
      createdBy: user.usernameIdp,
      id: expect.any(String),
      ...emailTemplate,
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should update template when it already exists', async () => {
    const id = uuidv4();
    service.readEmailTemplate = jest.fn().mockReturnValue({ id: id, ...emailTemplate });
    service.readEmailTemplates = jest.fn().mockReturnValue([{ id: id, ...emailTemplate }]);

    await service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user);

    expect(MockModel.update).toHaveBeenCalledTimes(1);
    expect(MockModel.update).toHaveBeenCalledWith({
      updatedBy: user.usernameIdp,
      ...emailTemplate,
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should not rollback when an error occurs outside transaction', async () => {
    service.readEmailTemplate = jest.fn().mockRejectedValue(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toHaveBeenCalledTimes(0);
  });

  it('should rollback when an insert error occurs inside transaction', async () => {
    service.readEmailTemplate = jest.fn().mockReturnValue(emailTemplate);
    service.readEmailTemplates = jest.fn().mockReturnValue([emailTemplate]);
    MockModel.insert = jest.fn().mockRejectedValue(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  it('should rollback when an update error occurs inside transaction', async () => {
    const id = uuidv4();
    service.readEmailTemplate = jest.fn().mockReturnValue({ id: id, ...emailTemplate });
    service.readEmailTemplates = jest.fn().mockReturnValue([{ id: id, ...emailTemplate }]);
    MockModel.update = jest.fn().mockRejectedValue(new Error('SQL Error'));

    await expect(service.createOrUpdateEmailTemplate(emailTemplate.formId, emailTemplate, user)).rejects.toThrow();

    expect(MockTransaction.rollback).toHaveBeenCalledTimes(1);
  });
});
