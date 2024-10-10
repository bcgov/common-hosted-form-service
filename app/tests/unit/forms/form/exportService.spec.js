const uuid = require('uuid');

const exportService = require('../../../../src/forms/form/exportService');
const emailService = require('../../../../src/forms/email/emailService');
const fileService = require('../../../../src/forms/file/service');
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

const formId = uuid.v4();

const getCsvRowCount = (result) => {
  return result.data.split('\n').length;
};
const getCsvRow = (result, index) => {
  const rows = result.data.split('\n');
  return rows[index];
};

describe('export', () => {
  const form = {
    id: formId,
    snake: () => {
      'form';
    },
  };
  const formSchema = {
    display: 'form',
    type: 'form',
    components: [
      {
        type: 'datagrid',
        label: 'Data Grid',
        components: [
          {
            type: 'simpletextfield',
            label: 'Text Field',
          },
        ],
      },
    ],
  };

  // Mock the internal functions that only do Objection calls.
  exportService._getForm = jest.fn().mockReturnValue(form);
  exportService._readLatestFormSchema = jest.fn().mockReturnValue(formSchema);

  describe('csv', () => {
    const currentUser = {
      usernameIdp: 'PAT_TEST',
    };

    describe('400 response when', () => {
      test('invalid preferences json', async () => {
        const params = {
          preference: '{',
        };

        await expect(exportService.export(formId, params, currentUser)).rejects.toThrow('400');
      });

      test('invalid export template', async () => {
        exportService._getData = jest.fn().mockReturnValue([]);
        const params = {
          format: 'csv',
          template: 'doesntexist',
          type: 'submissions',
        };

        await expect(exportService.export(formId, params, currentUser)).rejects.toThrow('400');
      });
    });

    describe('type 1 / multiRowEmptySpacesCSVExport', () => {
      const params = {
        emailExport: false,
        fields: [
          'form.submissionId',
          'form.confirmationId',
          'form.formName',
          'form.version',
          'form.createdAt',
          'form.fullName',
          'form.username',
          'form.email',
          'form.submittedAt',
          'simpletextfield',
        ],
        template: 'multiRowEmptySpacesCSVExport',
      };

      test('invalid form version', async () => {
        const submission = [
          {
            submissionId: 'd5a40f00-ee5e-49ab-9bd7-b34f7f7b9c1b',
            confirmationId: 'D5A40F00',
            formName: 'form',
            version: 1,
            createdAt: '2024-05-03T20:56:31.270Z',
            submittedAt: '2024-05-03T20:56:31.270Z',
            fullName: 'Pat Test',
            username: 'PAT_TEST',
            email: 'pat.test@gov.bc.ca',
            submission: {
              dataGrid: [
                {
                  simpletextfield: 'simple text field 1-1',
                },
              ],
              lateEntry: false,
            },
          },
        ];
        exportService._getData.mockReturnValueOnce(submission);
        exportService._readLatestFormSchema.mockReturnValueOnce();

        await expect(exportService.export(formId, params, currentUser)).rejects.toThrow('400');
      });
    });

    describe('type 3 / singleRowCSVExport', () => {
      const params = {
        emailExport: false,
        fields: [
          'form.submissionId',
          'form.confirmationId',
          'form.formName',
          'form.version',
          'form.createdAt',
          'form.fullName',
          'form.username',
          'form.email',
          'form.submittedAt',
          'dataGrid',
          'dataGrid.0.simpletextfield',
          'dataGrid.1.simpletextfield',
        ],
        template: 'singleRowCSVExport',
      };

      emailService.submissionExportLink = jest.fn();
      fileService.create = jest.fn().mockReturnValue({});

      test('data grid one row', async () => {
        const submission = [
          {
            submissionId: 'd5a40f00-ee5e-49ab-9bd7-b34f7f7b9c1b',
            confirmationId: 'D5A40F00',
            formName: 'form',
            version: 1,
            createdAt: '2024-05-03T20:56:31.270Z',
            submittedAt: '2024-05-03T20:56:31.270Z',
            fullName: 'Pat Test',
            username: 'PAT_TEST',
            email: 'pat.test@gov.bc.ca',
            submission: {
              dataGrid: [
                {
                  simpletextfield: 'simple text field 1-1',
                },
              ],
              lateEntry: false,
            },
          },
        ];
        exportService._getData = jest.fn().mockReturnValue(submission);

        const result = await exportService.export(formId, params, currentUser);

        expect(getCsvRowCount(result)).toBe(2);
        expect(getCsvRow(result, 0)).toContain('dataGrid.0.simpletextfield');
        expect(getCsvRow(result, 1)).toContain('simple text field 1-1');
      });

      test('data grid two rows', async () => {
        const submission = [
          {
            submissionId: 'd5a40f00-ee5e-49ab-9bd7-b34f7f7b9c1b',
            confirmationId: 'D5A40F00',
            formName: 'form',
            version: 1,
            createdAt: '2024-05-03T20:56:31.270Z',
            fullName: 'Pat Test',
            username: 'PAT_TEST',
            email: 'pat.test@gov.bc.ca',
            submission: {
              dataGrid: [
                {
                  simpletextfield: 'simple text field 1-1',
                },
                {
                  simpletextfield: 'simple text field 1-2',
                },
              ],
              lateEntry: false,
            },
          },
        ];
        exportService._getData = jest.fn().mockReturnValue(submission);

        const result = await exportService.export(formId, params, currentUser);

        expect(getCsvRowCount(result)).toBe(2);
        expect(getCsvRow(result, 0)).toContain('dataGrid.0.simpletextfield');
        expect(getCsvRow(result, 0)).toContain('dataGrid.1.simpletextfield');
        expect(getCsvRow(result, 1)).toContain('simple text field 1-1');
        expect(getCsvRow(result, 1)).toContain('simple text field 1-2');
      });

      test('data grid two submissions', async () => {
        const submission = [
          {
            submissionId: 'd5a40f00-ee5e-49ab-9bd7-b34f7f7b9c1b',
            confirmationId: 'D5A40F00',
            formName: 'form',
            version: 1,
            createdAt: '2024-05-03T20:56:31.270Z',
            fullName: 'Pat Test',
            username: 'PAT_TEST',
            email: 'pat.test@gov.bc.ca',
            submission: {
              dataGrid: [
                {
                  simpletextfield: 'simple text field 1-1',
                },
              ],
              lateEntry: false,
            },
          },
          {
            submissionId: 'c635b4b2-83de-4830-925a-bcba51efa139',
            confirmationId: 'C635B4B2',
            formName: 'form',
            version: 1,
            createdAt: '2024-05-05T20:56:31.270Z',
            fullName: 'Pat Test',
            username: 'PAT_TEST',
            email: 'pat.test@gov.bc.ca',
            submission: {
              dataGrid: [
                {
                  simpletextfield: 'simple text field 2-1',
                },
                {
                  simpletextfield: 'simple text field 2-2',
                },
              ],
              lateEntry: false,
            },
          },
        ];
        exportService._getData = jest.fn().mockReturnValue(submission);

        const result = await exportService.export(formId, params, currentUser);

        expect(getCsvRowCount(result)).toBe(3);
        expect(getCsvRow(result, 0)).toContain('dataGrid.0.simpletextfield');
        expect(getCsvRow(result, 0)).toContain('dataGrid.1.simpletextfield');
        expect(getCsvRow(result, 1)).toContain('simple text field 1-1');
        expect(getCsvRow(result, 2)).toContain('simple text field 2-1');
        expect(getCsvRow(result, 2)).toContain('simple text field 2-2');
      });
    });
  });
});

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
    expect(exportService._readLatestFormSchema).toBeCalledTimes(1);
    // expect(exportService._readLatestFormSchema).toBeCalledWith(123);

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
    expect(exportService._readLatestFormSchema).toBeCalledTimes(1);
    expect(exportService._readLatestFormSchema).toBeCalledWith(123, 1);

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
    expect(exportService._readLatestFormSchema).toBeCalledTimes(1);
    expect(exportService._readLatestFormSchema).toBeCalledWith(123, 1);

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
    expect(exportService._readLatestFormSchema).toBeCalledTimes(1);
    expect(exportService._readLatestFormSchema).toBeCalledWith(123, 1);

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
    expect(exportService._readLatestFormSchema).toBeCalledTimes(1);
    expect(exportService._readLatestFormSchema).toBeCalledWith(123, 1);

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
      'form.submittedAt',
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

    expect(exportService._getForm).toBeCalledWith('bd4dcf26-65bd-429b-967f-125500bfd8a4');
    expect(exportService._getData).toBeCalledWith(params.type, params.version, form, params);
    expect(exportService._getForm).toBeCalledTimes(1);
    expect(exportService._getData).toBeCalledTimes(1);
    expect(exportService._buildCsvHeaders).toBeCalledTimes(1);
    // test cases
    expect(fields.length).toEqual(20);
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
    expect(submissions.length).toEqual(10);
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
    expect(submissions.length).toEqual(11);
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
    expect(submissions.length).toEqual(11);
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

    expect(submissions.length).toEqual(12);
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
    expect(submissions.length).toEqual(10);
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
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(7);
    expect(MockModel.modify).toBeCalledWith('filterUpdatedAt', preference && preference.updatedMinDate, preference && preference.updatedMaxDate);
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
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(7);
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
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(7);
    expect(MockModel.modify).toBeCalledWith('filterUpdatedAt', preference && preference.updatedMinDate, preference && preference.updatedMaxDate);
  });
});
