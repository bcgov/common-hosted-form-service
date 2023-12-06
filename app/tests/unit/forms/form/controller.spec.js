const controller = require('../../../../src/forms/form/controller');
const exportService = require('../../../../src/forms/form/exportService');

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
    expect(exportService.fieldsForCSVExport).toHaveBeenCalledTimes(1);
  });

  it('should not continue with export if there are no submissions', async () => {
    const exportServiceSpy = jest.spyOn(exportService, 'export');
    const formatDataSpy = jest.spyOn(exportService, '_formatData');
    exportService._exportType = jest.fn().mockReturnValue('submissions');
    exportService._exportFormat = jest.fn().mockReturnValue('json');
    exportService._getForm = jest.fn().mockReturnValue({ id: '1111' });
    exportService._getSubmissions = jest.fn().mockReturnValue([]);

    await controller.export(req, {}, jest.fn());
    expect(exportServiceSpy).toHaveBeenCalledTimes(1);
    expect(exportService._getForm).toHaveBeenCalledTimes(1);
    expect(exportService._getSubmissions).toHaveBeenCalledTimes(1);
    expect(formatDataSpy).toHaveBeenCalledTimes(0);
  });
});
