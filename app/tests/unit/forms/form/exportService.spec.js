const exportService = require('../../../../src/forms/form/exportService');

describe('_readSchemaFields', () => {

  it('should get form fields in the order they appear in the kitchen sink form', async () => {

    // form schema from db
    const formSchema = require('../../../fixtures/form/kitchen_sink_schema.json');

    // expected field names in correct order returned from Kitchen Sink form schema
    const expectedFieldNames = [
      'textFieldNested1',
      'textFieldNested2',
      'textFieldInFieldset1',
      'selectListInFieldset1',
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
    expect(result).toHaveLength(24);
    expect(result).toEqual(expectedFieldNames);
  });


  it('should get form fields in the order they appear in an advanced form', async () => {

    // form schema from db
    const formSchema = require('../../../fixtures/form/advanced_schema.json');

    // expected input field names in correct order
    const expectedFieldNames = [
      'textincolumn1',
      'textinfieldset',
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
      'container1.containedTextField1',
      'container1.containedTextField2',
      'dataGrid.textFieldInDataGrid1',
      'dataGrid.textFieldInDataGrid2',
      'editGrid.textFieldInEditGrid1',
      'editGrid.textFieldInEditGrid2',
      'textFieldInTree1',
      'textFieldInTree2',
      'simplefile.url',
      'simplefile.url',
      'simplefile.data.id',
      'simplefile.size',
      'simplefile.storage',
      'simplefile.originalName',
      'orgbook'
    ];

    const result = await exportService._readSchemaFields(formSchema);
    expect(result).toHaveLength(39);
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

    expect(result).toHaveLength(37);
    expect(result).toEqual(expect.arrayContaining(['form.confirmationId', 'textFieldNested1', 'textFieldNested2']));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });


  describe('_buildCsvHeaders', () => {
    it('should build correct csv headers for big form', async () => {
      //

      // form schema from db
      const formSchema = require('../../../fixtures/form/annual_fisheries_production_schedule_-_wild_harvest_-_beta_test_schema.json');

      const extractedFields = require('../../../fixtures/form/fields/extractedFields.json');

      // form object from db
      const form = { id: 123 };


      // mock latestFormSchema
      exportService._readLatestFormSchema = jest.fn(() => { return formSchema; });

      // submissions export (matchces the format that is downloaded in UI)
      const submissionsExport = require('../../../fixtures/submission/big_form_test_submissions.json');

      // build csv headers
      // gets a a list of form meta fieldfs followed by submission fields
      const result = await exportService._buildCsvHeaders(form, submissionsExport,null);


      expect(result).toEqual(expect.arrayContaining(extractedFields));
      expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123);

      // restore mocked function to it's original implementation
      exportService._readLatestFormSchema.mockRestore();
    });
  });

});

