const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../src/forms/form/controller');
const exportService = require('../../../../src/forms/form/exportService');
const service = require('../../../../src/forms/form/service');

// Various strings that should produce 400 errors when used as UUIDs.
const testCases400 = [[''], ['undefined'], ['{{oops}}'], [uuid.v4() + '.']];

//
// Mock out all happy-path service calls.
//

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
  const formId = uuid.v4();
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
    const req = getMockReq({ params: { formId: formId } });
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

  test.each(testCases400)('should 400 if the formId is "%s"', async (eachFormId) => {
    // Arrange
    const req = getMockReq({ params: { formId: eachFormId } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toBeCalledTimes(0);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith({ detail: `Bad formId "${eachFormId}".` });
  });

  it('should forward service errors for handling elsewhere', async () => {
    // Arrange
    const error = new Error();
    service.listFormSubmissions = jest.fn(() => {
      throw error;
    });
    const req = getMockReq({ params: { formId: formId } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toBeCalled();
    expect(next).toBeCalledWith(error);
  });
});

describe('readFormOptions', () => {
  const formId = uuid.v4();
  const mockReadResponse = {
    form: {
      id: formId,
    },
  };

  it('should 200 if the formId is valid', async () => {
    // Arrange
    service.readFormOptions = jest.fn().mockReturnValue(mockReadResponse);
    const req = getMockReq({ params: { formId: formId } });
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

  test.each(testCases400)('should 400 if the formId is "%s"', async (eachFormId) => {
    // Arrange
    const req = getMockReq({ params: { formId: eachFormId } });
    const { res, next } = getMockRes();

    // Act
    await controller.readFormOptions(req, res, next);

    // Assert
    expect(service.readFormOptions).toBeCalledTimes(0);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith({ detail: `Bad formId "${eachFormId}".` });
  });

  it('should forward service errors for handling elsewhere', async () => {
    // Arrange
    const error = new Error();
    service.readFormOptions = jest.fn(() => {
      throw error;
    });
    const req = getMockReq({ params: { formId: formId } });
    const { res, next } = getMockRes();

    // Act
    await controller.readFormOptions(req, res, next);

    // Assert
    expect(service.readFormOptions).toBeCalled();
    expect(next).toBeCalledWith(error);
  });
});
