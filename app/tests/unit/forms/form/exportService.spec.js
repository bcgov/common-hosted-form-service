const exportService = require('../../../../src/forms/form/exportService');

describe('_buildCsvHeaders', () => {

  it.only('should build correct csv headers', async () => {

    // form object from db
    const form = { id: 1 };

    // latest form version's schema
    const formSchema = {
      type: 'form',
      components: [
        {
          key: 'firstName',
          label: 'First Name',
          input: true
        },
        {
          key: 'lastName',
          label: 'Last Name',
          input: true
        }
      ]
    };

    // submissions data
    const submissionsData = [
      {
        form: {
          confirmationId: 'ABC12345',
        },
        submit: true,
        lastName: 'Smith',
        firstName: 'John',
      },
      {
        form: {
          confirmationId: 'DEF67890',
        },
        submit: true,
        lastName: 'Doe',
        firstName: 'Mike',
      },
    ];

    // mock latestFormSchema
    exportService._readLatestFormSchema = jest.fn(() => { return formSchema; });

    // build csv headers
    const result = await exportService._buildCsvHeaders(form, submissionsData);

    // expect headers array to have 3 element - [ 'form.confirmationId', 'firstName', 'lastName' ]
    expect(result.length === 3).toBeTruthy();
  });

});
