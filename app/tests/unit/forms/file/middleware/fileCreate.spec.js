const { decideFileCreate } = require('../../../../../src/forms/file/middleware/filePermissions');

const AUTH_REQUIRED = { status: 403, detail: 'Authentication required for file uploads on this form' };
const NO_ACCESS = { status: 403, detail: 'You do not have access to upload files to this form.' };
const NOT_PUBLISHED = { status: 403, detail: 'This form is not accepting uploads.' };

const form = ({ idps = ['public'], published = true } = {}) => ({
  active: true,
  identityProviders: idps.map((code) => ({ code })),
  versions: [{ published: false }, { published }],
});

// Permissions as the form access lookup returns them.
const SUBMITTER = ['form_read', 'submission_create', 'document_template_read'];
const REVIEWER = ['form_read', 'submission_read', 'submission_update'];
const DESIGNER = ['form_read', 'design_create', 'design_read', 'design_update'];
const DESIGN_CREATE_ONLY = ['form_read', 'design_create'];
const DESIGN_UPDATE_ONLY = ['form_read', 'design_update'];
const READER = ['form_read', 'submission_read'];

describe('decideFileCreate', () => {
  describe('anonymous callers', () => {
    test.each([
      ['a published public form', form(), null],
      ['a published form that also allows a login provider', form({ idps: ['idir', 'public'] }), null],
      ['a public form with no published version', form({ published: false }), NOT_PUBLISHED],
      ['a login-only form', form({ idps: ['idir'] }), AUTH_REQUIRED],
      ['a login-only form with no published version', form({ idps: ['idir'], published: false }), AUTH_REQUIRED],
      ['a form with no identity providers listed', { active: true, versions: [{ published: true }] }, AUTH_REQUIRED],
    ])('%s', (_name, f, expected) => {
      expect(decideFileCreate({ form: f, signedIn: false })).toEqual(expected);
    });
  });

  describe('signed-in callers', () => {
    test.each([
      ['a submitter on a published form', form({ idps: ['idir'] }), SUBMITTER, null],
      ['a submitter on a form with no published version', form({ idps: ['idir'], published: false }), SUBMITTER, NOT_PUBLISHED],
      ['a team member who edits submissions, on a form with no published version (staff edit)', form({ idps: ['idir'], published: false }), REVIEWER, null],
      ['a designer, on a form with no published version (preview)', form({ idps: ['idir'], published: false }), DESIGNER, null],
      ['someone with design_create only, on a form with no published version', form({ idps: ['idir'], published: false }), DESIGN_CREATE_ONLY, null],
      ['someone with design_update only, on a form with no published version', form({ idps: ['idir'], published: false }), DESIGN_UPDATE_ONLY, null],
      ['someone who can only read submissions', form({ idps: ['idir'] }), READER, NO_ACCESS],
      ['someone with no access to the form', form({ idps: ['idir'] }), undefined, NO_ACCESS],
      ['someone with an empty permission list', form(), [], NO_ACCESS],
    ])('%s', (_name, f, permissions, expected) => {
      expect(decideFileCreate({ form: f, signedIn: true, permissions })).toEqual(expected);
    });

    test('the public identity provider alone does not let a signed-in caller upload', () => {
      expect(decideFileCreate({ form: form({ idps: ['public'] }), signedIn: true, permissions: undefined })).toEqual(NO_ACCESS);
    });

    test.each([
      ['with no access to the form', form({ idps: [] }), undefined],
      ['who can only submit, on a form with no published version', form({ idps: ['idir'], published: false }), SUBMITTER],
      ['who can only read, on a published form', form({ idps: ['idir'] }), READER],
    ])('can upload to the submission they can update, %s', (_name, f, permissions) => {
      expect(decideFileCreate({ form: f, signedIn: true, permissions, canUpdateSubmission: true })).toBeNull();
    });
  });

  test('an anonymous caller cannot use the submission they are editing to pass', () => {
    expect(decideFileCreate({ form: form({ idps: ['idir'] }), signedIn: false, canUpdateSubmission: true })).toEqual(AUTH_REQUIRED);
    expect(decideFileCreate({ form: form({ published: false }), signedIn: false, canUpdateSubmission: true })).toEqual(NOT_PUBLISHED);
  });

  test('an earlier published version counts, whatever the latest one is', () => {
    const f = { active: true, identityProviders: [{ code: 'public' }], versions: [{ published: true }, { published: false }] };

    expect(decideFileCreate({ form: f, signedIn: false })).toBeNull();
    expect(decideFileCreate({ form: f, signedIn: true, permissions: SUBMITTER })).toBeNull();
  });

  test('a form with no versions has no published version', () => {
    expect(decideFileCreate({ form: { active: true, identityProviders: [{ code: 'public' }] }, signedIn: false })).toEqual(NOT_PUBLISHED);
  });
});
