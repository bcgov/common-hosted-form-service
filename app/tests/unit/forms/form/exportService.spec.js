// const { NotFoundError } = require('objection');

const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/fileStorageReservation', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/submissionsExport', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/submissionsData', () => MockModel);

const exportService = require('../../../../src/forms/form/exportService');
const fileService = require('../../../../src/forms/file/service');
const formService = require('../../../../src/forms/form/service');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

const CURRENT_USER = {
  id: '0',
  usernameIdp: 'test',
};


describe('_readSchemaFields', () => {

  it('should get form fields in the order they appear in the kitchen sink form', async () => {

    // form schema from db
    const formSchema = require('../../../fixtures/form/kitchen_sink_schema.json');

    // expected field names in correct order returned from Kitchen Sink form schema
    const expectedFieldNames = [
      'textFieldNested1',
      'textFieldNested2',
      'heading',
      'textFieldInFieldset1',
      'selectListInFieldset1',
      'heading1',
      'paragraph',
      'email2',
      'number2',
      'textField3',
      'phoneNumber2',
      'registeredBusinessName1',
      'textField1',
      'multiLineText1',
      'selectList1',
      'selectList2',
      'checkbox1',
      'checkboxGroup1.check1',
      'checkboxGroup1.check2',
      'checkboxGroup1.check3',
      'radioGroup1',
      'number',
      'phoneNumber1',
      'email1',
      'dateTime1',
      'day1',
      'time1'
    ];

    const result = await exportService._readSchemaFields(formSchema);
    expect(result).toHaveLength(27);
    expect(result).toEqual(expectedFieldNames);
  });


  it('should get form fields in the order they appear in an advanced form', async () => {

    // form schema from db
    const formSchema = require('../../../fixtures/form/advanced_schema.json');

    // expected input field names in correct order
    const expectedFieldNames = [
      'textincolumn1',
      'textinfieldset',
      'numberintable1',
      'numberintable2',
      'numberintable3',
      'numberintable4',
      'dataGridInPanel',
      'dataGridInPanel.textInDatagridInPanel1',
      'dataGridInPanel.textInDatagridInPanel2',
      'tags',
      'address',
      'address.address1',
      'address.address2',
      'address.city',
      'address.state',
      'address.country',
      'address.zip',
      'password',
      'day',
      'selectBoxes1.box1',
      'selectBoxes1.box2',
      'selectBoxes1.box3',
      'select1',
      'currency',
      'survey1.question1',
      'survey1.question2',
      'survey1.question3',
      'signature',
      'hidden1',
      'container1',
      'container1.containedTextField1',
      'container1.containedTextField2',
      'dataMap',
      'dataGrid',
      'dataGrid.textFieldInDataGrid1',
      'dataGrid.textFieldInDataGrid2',
      'editGrid',
      'editGrid.textFieldInEditGrid1',
      'editGrid.textFieldInEditGrid2',
      'tree',
      'tree.textFieldInTree1',
      'tree.textFieldInTree2',
      'simplefile',
      'orgbook'
    ];

    const result = await exportService._readSchemaFields(formSchema);
    expect(result).toHaveLength(44);
    expect(result).toEqual(expectedFieldNames);
  });

  it('should get form fields in the order they appear in the kitchen sink form for datagrid', async () => {

    // form schema from db
    const formSchema = require('../../../fixtures/form/Kitchen_sink_form_schema_datagrid.json');

    // expected field names in correct order returned from Kitchen Sink form schema
    const expectedFieldNames = [
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

    const result = await exportService._readSchemaFields(formSchema);
    expect(result).toHaveLength(12);
    expect(result).toEqual(expectedFieldNames);
  });


  it('should get form fields in the order they appear in the kitchen sink form for multiple components', async () => {

    // form schema from db
    const formSchema = require('../../../fixtures/form/kitchen_sink_form_schema_multiple_component_test.json');

    // expected field names in correct order returned from Kitchen Sink form schema
    const expectedFieldNames = [
      'firstName',
      'lastName',
      'schoolName',
      'departmentName',
      'courseName',
      'name',
      'testname1',
      'testname2',
      'testname3',
      'simplenumber',
      'simpleemail',
      'simpledatetime',
      'simpleday',
      'yes',
      'radioGroup',
      'checkboxGroup.1',
      'checkboxGroup.2',
      'survey1.early',
      'survey1.late',
      'currency',
      'password',
      'url',
      'textArea',
      'number',
      'number1',
      'day',
      'selectBoxes1.a',
      'selectBoxes1.b',
      'selectBoxes1.c',
      'select1',
      'radio1',
      'dataMap',
      'simplefile',
      'orgbook',
    ];

    const result = await exportService._readSchemaFields(formSchema);
    expect(result).toHaveLength(34);
    expect(result).toEqual(expectedFieldNames);
  });

});


describe('_buildCsvHeaders', () => {
  it('should build correct csv headers', async () => {
    //

    // form schema from db
    const formSchema = require('../../../fixtures/form/kitchen_sink_schema.json');

    // form object from db
    const form = { id: 123 };


    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => { return formSchema; });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submissions_export.json');

    // build csv headers
    // gets a a list of form meta fieldfs followed by submission fields
    const result = await exportService._buildCsvHeaders(form, submissionsExport,null);

    expect(result).toHaveLength(44);
    expect(result).toEqual(expect.arrayContaining(['form.confirmationId', 'textFieldNested1', 'textFieldNested2']));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    // expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });

});


describe('_buildCsvHeaders', () => {
  it('should build correct csv headers', async () => {
    //

    // form schema from db
    const formSchema = require('../../../fixtures/form/Kitchen_sink_form_schema_datagrid.json');

    // form object from db
    const form = { id: 123 };


    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => { return formSchema; });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submission_data_export_datagrid.json');

    // build csv headers
    // gets a a list of form meta fieldfs followed by submission fields
    const result = await exportService._buildCsvHeaders(form, submissionsExport,1);

    expect(result).toHaveLength(19);
    expect(result).toEqual(expect.arrayContaining(['form.confirmationId','oneRowPerLake.closestTown', 'oneRowPerLake.dataGrid.fishType']));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123, 1);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });

});


describe('_buildCsvHeaders', () => {
  it('should build correct csv headers multiple components', async () => {
    //

    // form schema from db
    const formSchema = require('../../../fixtures/form/kitchen_sink_form_schema_multiple_component_test.json');

    // form object from db
    const form = { id: 123 };


    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => { return formSchema; });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submission_data_multiple_component_test.json');

    // build csv headers
    // gets a a list of form meta fieldfs followed by submission fields
    const result = await exportService._buildCsvHeaders(form, submissionsExport,1);

    expect(result).toHaveLength(42);
    expect(result).toEqual(expect.arrayContaining(['number1','selectBoxes1.a', 'number']));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123, 1);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });
});

describe('submissions exports', () => {
  describe('list', () => {
    it('should succeed', async () => {
      const params = {
        formId: null,
        formVersionId: null,
        reservationId: null,
        userId: null,
      };

      await exportService.listSubmissionsExports(params);

      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith();
      expect(MockModel.modify).toHaveBeenCalledTimes(5);
      expect(MockModel.modify).toHaveBeenCalledWith('filterFormId', null);
      expect(MockModel.modify).toHaveBeenCalledWith('filterFormVersionId', null);
      expect(MockModel.modify).toHaveBeenCalledWith('filterReservationId', null);
      expect(MockModel.modify).toHaveBeenCalledWith('filterUserId', null);
      expect(MockModel.modify).toHaveBeenCalledWith('orderDescending');
    });
  });

  describe('create', () => {
    it ('should succeed', async () => {
      const data = {
        id: '0',
        formId: '0',
        formVersionId: '0',
        reservationId: '0',
        userId: CURRENT_USER.id,
        createdBy: CURRENT_USER.usernameIdp,
      };

      await exportService.createSubmissionsExport(data.formId, data.formVersionId, data.reservationId, CURRENT_USER);

      expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith(MockTransaction);
      expect(MockModel.insert).toHaveBeenCalledTimes(1);
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('read', () => {
    it ('should succeed', async () => {
      const data = {
        id: '0'
      };

      const fn = () => exportService.readSubmissionsExport(data.id);

      await expect(fn()).resolves.not.toThrow();
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.findById).toHaveBeenCalledTimes(1);
    });

    it ('should throw when not found', async () => {
      const data = {
        id: '0'
      };
      MockModel.findById = jest.fn().mockReturnValue(undefined);

      const fn = () => exportService.readSubmissionsExport(data.id);

      await expect(fn()).rejects.toThrow();
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it ('should succeed', async () => {
      const data = {
        id: '0'
      };

      const fn = () => exportService.deleteSubmissionsExport(data.id);

      await expect(fn()).resolves.not.toThrow();
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.deleteById).toHaveBeenCalledTimes(1);
    });

    it ('should throw when not found', async () => {
      const data = {
        id: '0'
      };
      MockModel.deleteById = jest.fn().mockReturnValue(undefined);

      const fn = () => exportService.deleteSubmissionsExport(data.id);

      await expect(fn()).rejects.toThrow();
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.deleteById).toHaveBeenCalledTimes(1);
    });
  });
});

describe('exportWithReservation', () => {
  it ('should prune old submissions', async () => {
    const formId = '0';
    const referer = 'http://localhost:8081/app/blahblah';

    const oldExports = [
      {
        id: '0'
      },
      {
        id: '1'
      }
    ];

    const reservation = {
      id: '0',
    };


    let mockListReservation = jest.spyOn(formService, 'listReservation');
    let mockCreateReservation = jest.spyOn(formService, 'createReservation');
    let mockDeleteReservation = jest.spyOn(formService, 'deleteReservation');
    let mockListSubmissionsExports = jest.spyOn(exportService, 'listSubmissionsExports');
    let mockCreateSubmissionsExport = jest.spyOn(exportService, 'createSubmissionsExport');
    let mockExportToStorage = jest.spyOn(exportService, 'exportToStorage');

    mockListReservation.mockImplementation(() => oldExports);
    mockCreateReservation.mockImplementation(() => reservation);
    mockDeleteReservation.mockImplementation(() => undefined);
    mockListSubmissionsExports.mockImplementation(() => []);
    mockCreateSubmissionsExport.mockImplementation(() => undefined);
    mockExportToStorage.mockImplementation(() => {});

    await exportService.exportWithReservation(formId, formId, CURRENT_USER, referer);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockDeleteReservation).toHaveBeenCalledTimes(2);

    mockListReservation.mockRestore();
    mockCreateReservation.mockRestore();
    mockDeleteReservation.mockRestore();
    mockListSubmissionsExports.mockRestore();
    mockCreateSubmissionsExport.mockRestore();
    mockExportToStorage.mockRestore();
  });

  it ('should succeed', async () => {
    const formId = '0';
    const referer = 'http://localhost:8081/app/blahblah';

    const oldExports = [
      {
        id: '0'
      },
      {
        id: '1'
      }
    ];

    const reservation = {
      id: '0',
    };

    MockModel.first = jest.fn(() => {
      return {
        formVersionId: '0',
      };
    });

    let mockListReservation = jest.spyOn(formService, 'listReservation');
    let mockCreateReservation = jest.spyOn(formService, 'createReservation');
    let mockDeleteReservation = jest.spyOn(formService, 'deleteReservation');
    let mockListSubmissionsExports = jest.spyOn(exportService, 'listSubmissionsExports');
    let mockCreateSubmissionsExport = jest.spyOn(exportService, 'createSubmissionsExport');
    let mockExportToStorage = jest.spyOn(exportService, 'exportToStorage');

    mockListReservation.mockImplementation(() => oldExports);
    mockCreateReservation.mockImplementation(() => reservation);
    mockDeleteReservation.mockImplementation(() => undefined);
    mockListSubmissionsExports.mockImplementation(() => []);
    mockCreateSubmissionsExport.mockImplementation(() => undefined);
    mockExportToStorage.mockImplementation(() => {});

    await exportService.exportWithReservation(formId, formId, CURRENT_USER, referer);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockDeleteReservation).toHaveBeenCalledTimes(2);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.where).toHaveBeenCalledTimes(2);
    expect(MockModel.first).toHaveBeenCalledTimes(1);
    expect(mockCreateReservation).toHaveBeenCalledTimes(1);
    expect(mockCreateSubmissionsExport).toHaveBeenCalledTimes(1);
    expect(mockExportToStorage).toHaveBeenCalledTimes(1);

    mockListReservation.mockRestore();
    mockCreateReservation.mockRestore();
    mockDeleteReservation.mockRestore();
    mockListSubmissionsExports.mockRestore();
    mockCreateSubmissionsExport.mockRestore();
    mockExportToStorage.mockRestore();
  });
});

describe('exportToStorage', () => {
  it ('succeeds', async () => {
    const data = {
      reservationId: '0',
      formId: '0',
      currentUser: CURRENT_USER,
      referer: 'http://localhost:8081/app/blahblah',
    };

    const exportData = {
      data: 'hello world',
      headers: {
        'content-disposition': 'something; filename="filename.csv"; something=somethingelse',
        'content-type': 'text/csv',
      }
    };

    const metadata = {
      originalName: 'filename.csv',
      mimetype: 'text/csv',
      size: Buffer.byteLength((exportData.headers['content-type'] === 'application/json' ? JSON.stringify(exportData.data) : exportData.data))
    };

    let mockExport = jest.spyOn(exportService, 'export');
    let mockCreateData = jest.spyOn(fileService, 'createData');

    mockCreateData.mockImplementation(() => {});
    mockExport.mockImplementation(() => exportData);

    await exportService.exportToStorage(data.reservationId, data.formId, CURRENT_USER, data.referer);
    expect(mockExport).toHaveBeenCalledTimes(1);
    expect(mockExport).toHaveBeenCalledWith(data.formId, {});
    expect(mockCreateData).toHaveBeenCalledTimes(1);
    expect(mockCreateData).toHaveBeenCalledWith(data.formId, data.reservationId, metadata, exportData.data, CURRENT_USER, data.referer);

    mockExport.mockRestore();
    mockCreateData.mockRestore();
  });
});
