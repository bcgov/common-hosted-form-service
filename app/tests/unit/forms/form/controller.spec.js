const { getMockReq, getMockRes } = require('@jest-mock/express');
const { v4: uuidv4 } = require('uuid');

const controller = require('../../../../src/forms/form/controller');
const exportService = require('../../../../src/forms/form/exportService');
const service = require('../../../../src/forms/form/service');

describe('listFormSubmissions', () => {
  const uuid = uuidv4();
  const mockResponse = {
    results: [
      {
        confirmationId: 'ABC1234',
      },
    ],
  };

  // Test for 400 responses for various invalid UUIDs.
  const testCases400 = [[''], ['undefined'], ['{{frmId}}'], [uuidv4() + '.']];

  it('should 200 if the formId is valid', async () => {
    // Arrange
    service.listFormSubmissions = jest.fn().mockReturnValue(mockResponse);
    const req = getMockReq({ params: { formId: uuid } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  it('should 400 if the formSubmissionId is missing', async () => {
    // Arrange
    const req = getMockReq({ params: {} });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Invalid formId "undefined".' });
  });

  test.each(testCases400)('should 400 if the formSubmissionId is "%s"', async (formId) => {
    // Arrange
    const req = getMockReq({ params: { formId: formId } });
    const { res, next } = getMockRes();

    // Act
    await controller.listFormSubmissions(req, res, next);

    // Assert
    expect(service.listFormSubmissions).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ detail: `Invalid formId "${formId}".` });
  });

  it('should forward database errors for handling elsewhere', async () => {
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
    expect(service.listFormSubmissions).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('readFieldsForCSVExport', () => {
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
    headers: {},
  };

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
    expect(exportService.fieldsForCSVExport).toHaveBeenCalledTimes(1);
  });
});
