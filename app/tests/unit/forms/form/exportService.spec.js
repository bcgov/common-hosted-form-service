const exportService = require('../../../../src/forms/form/exportService');
const MockModel = require('../../../../src/forms/common/models/views/submissionData');
const _ = require('lodash');
jest.mock('../../../../src/forms/common/models/views/submissionData', () => ({
  query: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  column: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  modify: jest.fn().mockReturnThis(),
  then: jest.fn().mockReturnThis(),
}));

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
      'time1',
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
      'orgbook',
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
    exportService._readLatestFormSchema = jest.fn(() => {
      return formSchema;
    });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submissions_export.json');

    // build csv headers
    // gets a a list of form meta fieldfs followed by submission fields
    const result = await exportService._buildCsvHeaders(form, submissionsExport, null);

    expect(result).toHaveLength(44);
    expect(result).toEqual(expect.arrayContaining(['form.confirmationId', 'textFieldNested1', 'textFieldNested2']));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    // expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });
});

describe('_buildCsvHeaders', () => {
  it('should build correct csv headers for single row export option', async () => {
    //

    // form schema from db
    const formSchema = require('../../../fixtures/form/Kitchen_sink_form_schema_datagrid.json');

    // form object from db
    const form = { id: 123 };

    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => {
      return formSchema;
    });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submission_data_export_datagrid.json');

    // build csv headers
    // gets a a list of form meta fieldfs followed by submission fields
    const result = await exportService._buildCsvHeaders(form, submissionsExport, 1, null, true);

    expect(result).toHaveLength(29);
    expect(result).toEqual(
      expect.arrayContaining(['form.confirmationId', 'oneRowPerLake.0.closestTown', 'oneRowPerLake.0.dataGrid.0.fishType', 'oneRowPerLake.0.dataGrid.1.fishType'])
    );
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123, 1);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });
});

describe('_buildCsvHeaders', () => {
  it('should build correct csv headers for single row export option when selected fields provided', async () => {
    // form schema from db
    const formSchema = require('../../../fixtures/form/Kitchen_sink_form_schema_datagrid.json');

    // form object from db
    const form = { id: 123 };

    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => {
      return formSchema;
    });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submission_data_export_datagrid.json');

    // build csv headers
    // get fields which we gonna filtered column needed from
    const fields = require('../../../fixtures/submission/kitchen_sink_submission_data_export_datagrid_fields_selection.json');
    // get result columns if we need to filter out the columns
    const result = await exportService._buildCsvHeaders(form, submissionsExport, 1, fields, true);

    expect(result).toHaveLength(20);
    expect(result).toEqual(
      expect.arrayContaining([
        'form.confirmationId',
        'oneRowPerLake.0.closestTown',
        'oneRowPerLake.0.dataGrid.0.fishType',
        'oneRowPerLake.0.dataGrid.1.fishType',
        'oneRowPerLake.0.dataGrid.0.numberKept',
      ])
    );
    expect(result).toEqual(
      expect.not.arrayContaining([
        'oneRowPerLake.1.dataGrid.0.numberKept',
        'oneRowPerLake.1.lakeName',
        'oneRowPerLake.1.dataGrid.0.numberCaught',
        'oneRowPerLake.1.numberOfDays',
        'lateEntry',
      ])
    );
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123, 1);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });
});

describe('_buildCsvHeaders', () => {
  it('should build correct csv headers with correct order (as it goes in form design) for single row export option', async () => {
    // form schema from db
    const formSchema = require('../../../fixtures/form/Kitchen_sink_form_schema_datagrid.json');

    // form object from db
    const form = { id: 123 };

    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => {
      return formSchema;
    });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submission_data_export_datagrid.json');

    // build csv headers
    // get result columns if we need to filter out the columns
    const result = await exportService._buildCsvHeaders(form, submissionsExport, 1, null, true);

    expect(result).toHaveLength(29);

    // making sure that order of the result columns are same as it goes in a form designer
    expect(result[0]).toEqual('form.confirmationId');
    expect(result[7]).toEqual('fishermansName');
    expect(result[10]).toEqual('didYouFishAnyBcLakesThisYear');
    expect(result[11]).toEqual('oneRowPerLake.0.dataGrid.0.fishType');
    expect(result[13]).toEqual('oneRowPerLake.0.dataGrid.0.numberCaught');
    expect(result[18]).toEqual('oneRowPerLake.0.closestTown');
    expect(result[28]).toEqual('oneRowPerLake.1.numberOfDays');
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
    exportService._readLatestFormSchema = jest.fn(() => {
      return formSchema;
    });

    // submissions export (matchces the format that is downloaded in UI)
    const submissionsExport = require('../../../fixtures/submission/kitchen_sink_submission_data_multiple_component_test.json');

    // build csv headers
    // gets a a list of form meta fieldfs followed by submission fields
    const result = await exportService._buildCsvHeaders(form, submissionsExport, 1, null, true);

    expect(result).toHaveLength(41);
    expect(result).toEqual(expect.arrayContaining(['number1', 'selectBoxes1.a', 'number']));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123, 1);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });
});

describe('', () => {
  it('should return right number of fields with columns for csv export', async () => {
    // form schema from db
    const submission = require('../../../fixtures/submission/kitchen_sink_submission_extract_field_csv_export.json');

    const form = {
      id: 'bd4dcf26-65bd-429b-967f-125500bfd8a4',
      name: 'Fisheries',
      description: '',
      active: true,
      labels: [],
      createdBy: 'AIDOWU@idir',
      createdAt: '2023-03-29T14:09:28.457Z',
      updatedBy: 'AIDOWU@idir',
      updatedAt: '2023-04-10T16:19:43.491Z',
      showSubmissionConfirmation: true,
      submissionReceivedEmails: [],
      enableStatusUpdates: false,
      enableSubmitterDraft: true,
      schedule: {},
      reminder_enabled: false,
      enableCopyExistingSubmission: false,
    };

    const params = {
      type: 'submissions',
      draft: false,
      deleted: false,
      version: 1,
    };

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

    // mock readVersion function
    exportService._getForm = jest.fn().mockReturnValue(form);

    exportService._getData = jest.fn().mockReturnValue(submission);

    exportService._buildCsvHeaders = jest.fn().mockReturnValue(formFields);

    // get fields
    const fields = await exportService.fieldsForCSVExport('bd4dcf26-65bd-429b-967f-125500bfd8a4', params);

    expect(exportService._getForm).toHaveBeenCalledWith('bd4dcf26-65bd-429b-967f-125500bfd8a4');
    expect(exportService._getData).toHaveBeenCalledWith(params.type, params.version, form, params);
    expect(exportService._getForm).toHaveBeenCalledTimes(1);
    expect(exportService._getData).toHaveBeenCalledTimes(1);
    expect(exportService._buildCsvHeaders).toHaveBeenCalledTimes(1);
    // test cases
    expect(fields.length).toEqual(19);
  });
});

describe('_submissionsColumns', () => {
  const form = {
    id: 'bd4dcf26-65bd-429b-967f-125500bfd8a4',
    name: 'Fisheries',
    description: '',
    active: true,
    labels: [],
    createdBy: 'AIDOWU@idir',
    createdAt: '2023-03-29T14:09:28.457Z',
    updatedBy: 'AIDOWU@idir',
    updatedAt: '2023-04-10T16:19:43.491Z',
    showSubmissionConfirmation: true,
    submissionReceivedEmails: [],
    enableStatusUpdates: false,
    enableSubmitterDraft: true,
    schedule: {},
    reminder_enabled: false,
    enableCopyExistingSubmission: false,
  };

  it('should return right columns, when no prefered columns passed as params.', async () => {
    const params = {
      type: 'submissions',
      format: 'json',
      drafts: true,
      deleted: false,
      version: 1,
    };

    const submissions = exportService._submissionsColumns(form, params);
    expect(submissions.length).toEqual(9);
    expect(submissions).toEqual(expect.arrayContaining(['submissionId', 'confirmationId', 'formName', 'version', 'createdAt', 'fullName', 'username', 'email', 'submission']));
  });

  it('should return right number of columns, when 1 prefered column (deleted) passed as params.', async () => {
    const params = {
      type: 'submissions',
      format: 'json',
      drafts: true,
      deleted: false,
      version: 1,
      columns: ['deleted'],
    };

    const submissions = exportService._submissionsColumns(form, params);
    expect(submissions.length).toEqual(10);
  });

  it('should return right number of columns, when 1 prefered column (draft) passed as params.', async () => {
    const params = {
      type: 'submissions',
      format: 'json',
      drafts: true,
      deleted: false,
      version: 1,
      columns: ['draft'],
    };

    const submissions = exportService._submissionsColumns(form, params);
    expect(submissions.length).toEqual(10);
  });

  it('should return right number of columns, when 2 prefered column (draft & deleted) passed as params.', async () => {
    const params = {
      type: 'submissions',
      format: 'json',
      drafts: true,
      deleted: false,
      version: 1,
      columns: ['draft', 'deleted'],
    };

    const submissions = exportService._submissionsColumns(form, params);

    expect(submissions.length).toEqual(11);
  });

  it('should return right number of columns, when a garbage or NON-allowed column (testCol1 & testCol2) passed as params.', async () => {
    const params = {
      type: 'submissions',
      format: 'json',
      drafts: true,
      deleted: false,
      version: 1,
      columns: ['testCol1', 'testCol2'],
    };

    const submissions = exportService._submissionsColumns(form, params);
    expect(submissions.length).toEqual(9);
  });
});

describe('_getSubmissions', () => {
  // form schema from db
  const form = {
    id: 'bd4dcf26-65bd-429b-967f-125500bfd8a4',
    name: 'Fisheries',
    description: '',
    active: true,
    labels: [],
    createdBy: 'AIDOWU@idir',
    createdAt: '2023-03-29T14:09:28.457Z',
    updatedBy: 'AIDOWU@idir',
    updatedAt: '2023-04-10T16:19:43.491Z',
    showSubmissionConfirmation: true,
    submissionReceivedEmails: [],
    enableStatusUpdates: false,
    enableSubmitterDraft: true,
    schedule: {},
    reminder_enabled: false,
    enableCopyExistingSubmission: false,
  };

  it('Should pass this test with empty preference passed to _getSubmissions', async () => {
    const params = {
      type: 'submissions',
      draft: false,
      deleted: false,
      version: 1,
      preference: {
        updatedMinDate: '',
        updatedMaxDate: '',
      },
    };

    MockModel.query.mockImplementation(() => MockModel);
    exportService._submissionsColumns = jest.fn().mockReturnThis();

    let preference;
    if (params.preference && _.isString(params.preference)) {
      preference = JSON.parse(params.preference);
    } else {
      preference = params.preference;
    }
    exportService._getSubmissions(form, params, params.version);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(7);
    expect(MockModel.modify).toHaveBeenCalledWith('filterUpdatedAt', preference && preference.updatedMinDate, preference && preference.updatedMaxDate);
  });

  it('Should pass this test without preference passed to _getSubmissions and without calling updatedAt modifier', async () => {
    const params = {
      type: 'submissions',
      draft: false,
      deleted: false,
      version: 1,
    };

    MockModel.query.mockImplementation(() => MockModel);
    exportService._submissionsColumns = jest.fn().mockReturnThis();
    exportService._getSubmissions(form, params, params.version);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(7);
  });

  it('Should pass this test with preference passed to _getSubmissions', async () => {
    const params = {
      type: 'submissions',
      draft: false,
      deleted: false,
      version: 1,
      preference: {
        updatedMinDate: '2020-12-10T08:00:00Z',
        updatedMaxDate: '2020-12-17T08:00:00Z',
      },
    };

    MockModel.query.mockImplementation(() => MockModel);
    exportService._submissionsColumns = jest.fn().mockReturnThis();

    let preference;
    if (params.preference && _.isString(params.preference)) {
      preference = JSON.parse(params.preference);
    } else {
      preference = params.preference;
    }
    exportService._getSubmissions(form, params, params.version);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledTimes(7);
    expect(MockModel.modify).toHaveBeenCalledWith('filterUpdatedAt', preference && preference.updatedMinDate, preference && preference.updatedMaxDate);
  });
});
