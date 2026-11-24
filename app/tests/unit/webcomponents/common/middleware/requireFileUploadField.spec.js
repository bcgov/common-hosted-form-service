const requireFileUploadField = require('../../../../../src/webcomponents/common/middleware/requireFileUploadField');

const withSchema = (schema) => ({ securityContext: { resource: { form: { versions: [{ schema }] } } } });

describe('webcomponents/common/middleware/requireFileUploadField', () => {
  it('allows a form whose published version has a file upload field', () => {
    const next = jest.fn();

    requireFileUploadField(withSchema({ components: [{ type: 'panel', key: 'p', components: [{ type: 'simplefile', key: 'upload', input: true }] }] }), {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ['a form without a file upload field', withSchema({ components: [{ type: 'textfield', key: 'name', input: true }] })],
    ['a form without a published version', { securityContext: { resource: { form: { versions: [] } } } }],
  ])('rejects %s with 403', (_name, req) => {
    const next = jest.fn();

    requireFileUploadField(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403, detail: 'This form does not accept file uploads.' }));
  });
});
