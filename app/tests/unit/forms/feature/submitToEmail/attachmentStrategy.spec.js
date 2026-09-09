jest.mock('../../../../../src/forms/common/utils', () => ({ getBaseUrl: jest.fn(() => 'http://localhost') }));

const attachmentStrategy = require('../../../../../src/forms/feature/submitToEmail/delivery/attachmentStrategy');

const args = () => ({
  form: { id: 'f', name: 'F' },
  submission: { submission: { id: 's', confirmationId: 'ABC' } },
  report: { filename: 'r.pdf', buffer: Buffer.from('report') },
  files: [{ filename: 'a.pdf', buffer: Buffer.from('aa'), mimeType: 'application/pdf' }],
  recipients: ['a@b.com'],
});

it('attaches the report + files (base64) and uses the attachments email body', async () => {
  const { configData, contexts, summary } = await attachmentStrategy.prepare(args());

  expect(configData.bodyTemplate).toBe('submission-attachments.html');
  // report first, then each file, all base64-encoded
  expect(configData.attachments).toHaveLength(2);
  expect(configData.attachments[0]).toMatchObject({ filename: 'r.pdf', encoding: 'base64' });
  expect(configData.attachments[0].content).toBe(Buffer.from('report').toString('base64'));
  expect(configData.attachments[1]).toMatchObject({ filename: 'a.pdf', encoding: 'base64', contentType: 'application/pdf' });

  // no download link in the context for the attachment path
  expect(contexts[0].context.submissionPackageUrl).toBeUndefined();
  expect(contexts[0].context.confirmationNumber).toBe('ABC');
  expect(contexts[0].to).toEqual(['a@b.com']);

  expect(summary).toContain('report + 1 file(s)');
});

it('exposes its name', () => {
  expect(attachmentStrategy.name).toBe('attachment');
});
