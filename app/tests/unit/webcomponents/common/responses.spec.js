const { formSchemaResponse, submissionResponse, submitResponse } = require('../../../../src/webcomponents/common/responses');

const people = { createdBy: 'JDOE@idir', updatedBy: 'ASMITH@idir' };
const schema = { display: 'form', type: 'form', components: [{ type: 'textfield', key: 'name' }] };

const publishedForm = () => ({
  id: 'form-1',
  name: 'Form',
  description: 'About the form',
  showSubmissionConfirmation: true,
  hideSubmissionContentOnSuccess: false,
  enableSubmitterDraft: false,
  submissionReceivedEmails: ['owner@example.com'],
  schedule: { enabled: false },
  createdAt: '2026-10-01T00:00:00.000Z',
  ...people,
  identityProviders: [{ code: 'public', idp: 'public', permissions: [], tokenmap: {}, ...people }],
  versions: [{ id: 'version-1', version: 2, published: true, schema: { ...schema, ...people }, ...people }],
});

describe('formSchemaResponse', () => {
  it('returns only the form fields a component release reads, and the published schema', () => {
    expect(formSchemaResponse(publishedForm())).toEqual({
      form: {
        name: 'Form',
        description: 'About the form',
        showSubmissionConfirmation: true,
        hideSubmissionContentOnSuccess: false,
        enableSubmitterDraft: false,
        identityProviders: [{ code: 'public' }],
      },
      schema,
    });
  });

  it('leaves out names, emails and other settings', () => {
    expect(JSON.stringify(formSchemaResponse(publishedForm()))).not.toMatch(/createdBy|updatedBy|JDOE|ASMITH|owner@example.com|schedule|version-1/);
  });

  it('does not change the form it was given', () => {
    const original = publishedForm();

    formSchemaResponse(original);

    expect(original.createdBy).toBe('JDOE@idir');
    expect(original.versions[0].schema.updatedBy).toBe('ASMITH@idir');
  });

  it('falls back to form.schema when there are no versions', () => {
    const response = formSchemaResponse({ name: 'Form', schema: { ...schema, ...people }, ...people });

    expect(response.schema).toEqual(schema);
    expect(response.form.identityProviders).toEqual([]);
  });
});

describe('submissionResponse', () => {
  const read = () => ({
    submission: {
      id: 'sub-1',
      confirmationId: 'SUB1',
      draft: false,
      submission: { data: { name: 'Ada' }, metadata: { userAgent: 'Browser/1.0', referrer: 'https://host.example' } },
      ...people,
    },
    version: { id: 'version-1', version: 2, schema: { ...schema, ...people }, ...people },
    form: {
      id: 'form-1',
      name: 'Form',
      submissionReceivedEmails: ['owner@example.com'],
      ...people,
      formMetadata: { id: 'meta-1', metadata: { team: 'x' }, ...people },
      identityProviders: [{ code: 'idir', ...people }],
    },
  });

  it('returns only the submitted data', () => {
    expect(submissionResponse(read())).toEqual({ submission: { submission: { data: { name: 'Ada' } } } });
  });

  it('is what the web component parses for prefill', () => {
    const response = submissionResponse(read());

    // FormViewerUtils.parseSubmissionData reads submission.submission.data in every release
    expect(response.submission.submission.data).toEqual({ name: 'Ada' });
    expect(JSON.stringify(response)).not.toMatch(/createdBy|updatedBy|owner@example.com|userAgent|form-1|version-1/);
  });

  it('returns empty data for a submission without any', () => {
    expect(submissionResponse({ submission: { submission: {} } })).toEqual({ submission: { submission: { data: {} } } });
  });
});

describe('submitResponse', () => {
  it('returns only the id, confirmation id, time and draft flag of a saved submission', () => {
    const saved = {
      id: 'sub-1',
      confirmationId: 'SUB1',
      createdAt: '2026-10-25T00:00:00.000Z',
      draft: true,
      formVersionId: 'version-1',
      dedupKey: null,
      deleted: false,
      submission: { data: { name: 'Ada' }, metadata: { userAgent: 'Browser/1.0' } },
      ...people,
    };

    expect(submitResponse(saved)).toStrictEqual({ id: 'sub-1', confirmationId: 'SUB1', createdAt: '2026-10-25T00:00:00.000Z', draft: true });
  });

  it('reports a submission without a draft flag as final', () => {
    expect(submitResponse({ id: 'sub-1' }).draft).toBe(false);
  });
});
