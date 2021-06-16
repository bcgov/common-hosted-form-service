const exportService = require('../../../../src/forms/form/exportService');

describe('_buildCsvHeaders', () => {

  it('should build correct csv headers', async () => {

    // form object from db
    const form = { id: 123 };

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

    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining([ 'form.confirmationId', 'firstName', 'lastName' ]));
    expect(exportService._readLatestFormSchema).toHaveBeenCalledTimes(1);
    expect(exportService._readLatestFormSchema).toHaveBeenCalledWith(123);

    // restore mocked function to it's original implementation
    exportService._readLatestFormSchema.mockRestore();
  });

});
