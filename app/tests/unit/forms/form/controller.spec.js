const { getMockReq, getMockRes } = require('@jest-mock/express');
const { v4: uuidv4 } = require('uuid');

const { ENCRYPTION_ALGORITHMS } = require('../../../../src/components/encryptionService');

const controller = require('../../../../src/forms/form/controller');
const exportService = require('../../../../src/forms/form/exportService');
const service = require('../../../../src/forms/form/service');
const { ExternalAPI } = require('../../../../src/forms/common/models');
const ExternalAPIStatuses = require('../../../../src/forms/common/constants');

const currentUser = {
  usernameIdp: 'TESTER',
};

const documentTemplate = {
  filename: 'cdogs_template.txt',
  formId: uuidv4(),
  id: uuidv4(),
  template: 'My Template',
};

const error = new Error('error');

// Various strings that should produce 400 errors when used as UUIDs.
const testCases400 = [[''], ['undefined'], ['{{oops}}'], [uuidv4() + '.']];

//
// Mock out all happy-path service calls.
//

service.documentTemplateCreate = jest.fn().mockReturnValue(documentTemplate);
service.documentTemplateDelete = jest.fn().mockReturnValue();
service.documentTemplateList = jest.fn().mockReturnValue([]);
service.documentTemplateRead = jest.fn().mockReturnValue(documentTemplate);

const req = {
  params: { formId: 'bd4dcf26-65bd-429b-967f-125500bfd8a4' },
  query: {
    type: 'submissions',
    draft: false,
    deleted: false,
    version: 1,
  },
  body: {},
  currentUser: {},
  headers: {
    referer: '',
  },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('documentTemplateCreate', () => {
  const validRequest = {
    body: {
      ...documentTemplate,
    },
    currentUser: currentUser,
    params: {
      formId: documentTemplate.formId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateCreate(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.documentTemplateCreate.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateCreate(req, res, next);

      expect(service.documentTemplateCreate).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser.usernameIdp);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('201 response when', () => {
    it('has a successful service call', async () => {
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateCreate(req, res, next);

      expect(service.documentTemplateCreate).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser.usernameIdp);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...documentTemplate,
        })
      );
      expect(res.status).toBeCalledWith(201);
      expect(next).not.toBeCalled();
    });
  });
});

describe('documentTemplateDelete', () => {
  const validRequest = {
    currentUser: currentUser,
    params: {
      documentTemplateId: documentTemplate.id,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateDelete(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.documentTemplateDelete.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateDelete(req, res, next);

      expect(service.documentTemplateDelete).toBeCalledWith(validRequest.params.documentTemplateId, validRequest.currentUser.usernameIdp);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('204 response when', () => {
    it('has a successful service call', async () => {
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateDelete(req, res, next);

      expect(service.documentTemplateDelete).toBeCalledWith(validRequest.params.documentTemplateId, validRequest.currentUser.usernameIdp);
      expect(res.json).not.toBeCalled();
      expect(res.status).toBeCalledWith(204);
      expect(next).not.toBeCalled();
    });
  });
});

describe('documentTemplateList', () => {
  const validRequest = {
    params: { formId: documentTemplate.formId },
  };

  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.documentTemplateList.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateList(req, res, next);

      expect(service.documentTemplateList).toBeCalledWith(validRequest.params.formId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateList(req, res, next);

      expect(service.documentTemplateList).toBeCalledWith(validRequest.params.formId);
      expect(res.json).toBeCalledWith([]);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('documentTemplateRead', () => {
  const validRequest = {
    params: { formId: documentTemplate.formId },
  };

  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.documentTemplateRead.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateRead(req, res, next);

      expect(service.documentTemplateRead).toBeCalledWith(validRequest.params.documentTemplateId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.documentTemplateRead(req, res, next);

      expect(service.documentTemplateRead).toBeCalledWith(validRequest.params.documentTemplateId);
      expect(res.json).toBeCalledWith(documentTemplate);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('form controller', () => {
  it('should get all form and submissions fields for CSV export', async () => {
    const formFields = [
      'form.confirmationId',
      'form.formName',
      'form.version',
      'form.createdAt',
      'form.fullName',
      'form.username',
      'form.email',
      'fishermansName',
      'email',
      'forWhichBcLakeRegionAreYouCompletingTheseQuestions',
      'didYouFishAnyBcLakesThisYear',
      'oneRowPerLake',
      'oneRowPerLake.lakeName',
      'oneRowPerLake.closestTown',
      'oneRowPerLake.numberOfDays',
      'oneRowPerLake.dataGrid',
      'oneRowPerLake.dataGrid.fishType',
      'oneRowPerLake.dataGrid.numberCaught',
      'oneRowPerLake.dataGrid.numberKept',
    ];

    exportService.fieldsForCSVExport = jest.fn().mockReturnValue(formFields);

    await controller.readFieldsForCSVExport(req, {}, jest.fn());
    expect(exportService.fieldsForCSVExport).toBeCalledTimes(1);
  });

  it('should not continue with export if there are no submissions', async () => {
    const exportServiceSpy = jest.spyOn(exportService, 'export');
    const formatDataSpy = jest.spyOn(exportService, '_formatData');
    exportService._exportType = jest.fn().mockReturnValue('submissions');
    exportService._exportFormat = jest.fn().mockReturnValue('json');
    exportService._getForm = jest.fn().mockReturnValue({ id: '1111' });
    exportService._getSubmissions = jest.fn().mockReturnValue([]);

    await controller.export(req, {}, jest.fn());
    expect(exportServiceSpy).toBeCalledTimes(1);
    expect(exportService._getForm).toBeCalledTimes(1);
    expect(exportService._getSubmissions).toBeCalledTimes(1);
    expect(formatDataSpy).toBeCalledTimes(1);
  });
});

describe('listFormSubmissions', () => {
  const uuid = uuidv4();
  const mockResponse = {
    results: [
      {
        confirmationId: 'ABC1234',
      },
    ],
  };

  it('should 200 if the formId is valid', async () => {
    // Arrange
    service.listFormSubmissions = jest.fn().mockReturnValue(mockResponse);
    const req = getMockReq({ params: { formId: uuid } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toBeCalled();
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(mockResponse);
  });

  it('should 400 if the formId is missing', async () => {
    // Arrange
    const req = getMockReq({ params: {} });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toBeCalledTimes(0);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith({ detail: 'Bad formId "undefined".' });
  });

  test.each(testCases400)('should 400 if the formId is "%s"', async (formId) => {
    // Arrange
    const req = getMockReq({ params: { formId: formId } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toBeCalledTimes(0);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith({ detail: `Bad formId "${formId}".` });
  });

  it('should forward service errors for handling elsewhere', async () => {
    // Arrange
    const error = new Error();
    service.listFormSubmissions = jest.fn(() => {
      throw error;
    });
    const req = getMockReq({ params: { formId: uuid } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toBeCalled();
    expect(next).toBeCalledWith(error);
  });
});

describe('readFormOptions', () => {
  const uuid = uuidv4();
  const mockReadResponse = {
    form: {
      id: uuid,
    },
  };

  it('should 200 if the formId is valid', async () => {
    // Arrange
    service.readFormOptions = jest.fn().mockReturnValue(mockReadResponse);
    const req = getMockReq({ params: { formId: uuid } });
    const { res, next } = getMockRes();

    // Act
    await controller.readFormOptions(req, res, next);

    // Assert
    expect(service.readFormOptions).toBeCalled();
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(mockReadResponse);
  });

  it('should 400 if the formId is missing', async () => {
    // Arrange
    const req = getMockReq({ params: {} });
    const { res, next } = getMockRes();

    // Act
    await controller.readFormOptions(req, res, next);

    // Assert
    expect(service.readFormOptions).toBeCalledTimes(0);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith({ detail: 'Bad formId "undefined".' });
  });

  test.each(testCases400)('should 400 if the formId is "%s"', async (formId) => {
    // Arrange
    const req = getMockReq({ params: { formId: formId } });
    const { res, next } = getMockRes();

    // Act
    await controller.readFormOptions(req, res, next);

    // Assert
    expect(service.readFormOptions).toBeCalledTimes(0);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith({ detail: `Bad formId "${formId}".` });
  });

  it('should forward service errors for handling elsewhere', async () => {
    // Arrange
    const error = new Error();
    service.readFormOptions = jest.fn(() => {
      throw error;
    });
    const req = getMockReq({ params: { formId: uuid } });
    const { res, next } = getMockRes();

    // Act
    await controller.readFormOptions(req, res, next);

    // Assert
    expect(service.readFormOptions).toBeCalled();
    expect(next).toBeCalledWith(error);
  });
});

describe('listExternalAPIs', () => {
  describe('200 response when', () => {
    it('has a successful query call', async () => {
      service.listExternalAPIs = jest.fn().mockReturnValue([]);
      const req = getMockReq({
        params: {
          formId: '123',
        },
      });
      const { res, next } = getMockRes();

      await controller.listExternalAPIs(req, res, next);

      expect(service.listExternalAPIs).toBeCalledWith('123');
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('createExternalAPI', () => {
  let returnValue = null;
  beforeEach(() => {
    returnValue = null;
    ExternalAPI.mockReturnValue = (value) => {
      returnValue = value;
    };
    ExternalAPI.query = jest.fn().mockReturnThis();
    ExternalAPI.where = jest.fn().mockReturnThis();
    ExternalAPI.modify = jest.fn().mockReturnThis();
    ExternalAPI.first = jest.fn().mockReturnThis();
    ExternalAPI.startTransaction = jest.fn();
    ExternalAPI.throwIfNotFound = jest.fn().mockReturnThis();
    ExternalAPI.then = jest.fn((done) => {
      done(returnValue);
    });
  });

  const formId = uuidv4();
  const externalApi = {
    id: uuidv4(),
    formId: formId,
    name: 'test_api',
    endpointUrl: 'http://external.api/',
    sendApiKey: true,
    apiKeyHeader: 'X-API-KEY',
    apiKey: 'my-api-key',
    sendUserToken: true,
    userTokenHeader: 'Authorization',
    userTokenBearer: true,
    sendUserInfo: true,
    userInfoHeader: 'X-API-USER',
    userInfoEncrypted: true,
    userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
    userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
    code: ExternalAPIStatuses.SUBMITTED,
  };
  const validRequest = {
    body: {
      ...externalApi,
    },
    currentUser: currentUser,
    params: {
      formId: formId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.createExternalAPI(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.createExternalAPI = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.createExternalAPI(req, res, next);

      expect(service.createExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.createExternalAPI = jest.fn().mockResolvedValue(externalApi);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.createExternalAPI(req, res, next);

      expect(service.createExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...externalApi,
        })
      );
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
describe('updateExternalAPI', () => {
  let returnValue = null;
  beforeEach(() => {
    returnValue = null;
    ExternalAPI.mockReturnValue = (value) => {
      returnValue = value;
    };
    ExternalAPI.query = jest.fn().mockReturnThis();
    ExternalAPI.where = jest.fn().mockReturnThis();
    ExternalAPI.modify = jest.fn().mockReturnThis();
    ExternalAPI.first = jest.fn().mockReturnThis();
    ExternalAPI.startTransaction = jest.fn();
    ExternalAPI.throwIfNotFound = jest.fn().mockReturnThis();
    ExternalAPI.then = jest.fn((done) => {
      done(returnValue);
    });
  });

  const formId = uuidv4();
  const externalAPIId = uuidv4();
  const externalApi = {
    id: externalAPIId,
    formId: formId,
    name: 'test_api',
    endpointUrl: 'http://external.api/',
    sendApiKey: true,
    apiKeyHeader: 'X-API-KEY',
    apiKey: 'my-api-key',
    sendUserToken: true,
    userTokenHeader: 'Authorization',
    userTokenBearer: true,
    sendUserInfo: true,
    userInfoHeader: 'X-API-USER',
    userInfoEncrypted: true,
    userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
    userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
    code: ExternalAPIStatuses.SUBMITTED,
  };
  const validRequest = {
    body: {
      ...externalApi,
    },
    currentUser: currentUser,
    params: {
      formId: formId,
      externalAPIId: externalAPIId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.updateExternalAPI(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.updateExternalAPI = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.updateExternalAPI(req, res, next);

      expect(service.updateExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.params.externalAPIId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.updateExternalAPI = jest.fn().mockResolvedValue(externalApi);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.updateExternalAPI(req, res, next);

      expect(service.updateExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.params.externalAPIId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...externalApi,
        })
      );
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
