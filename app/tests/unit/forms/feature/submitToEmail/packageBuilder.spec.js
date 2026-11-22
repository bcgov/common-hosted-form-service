jest.mock('../../../../../src/components/cdogsService', () => ({ templateUploadAndRender: jest.fn() }));
jest.mock('../../../../../src/forms/file/service', () => ({ create: jest.fn(), read: jest.fn() }));
jest.mock('../../../../../src/forms/file/storage/storageService', () => ({ move: jest.fn(), read: jest.fn() }));
jest.mock('../../../../../src/forms/common/models', () => ({ FileStorage: { query: jest.fn() }, SubmissionMetadata: { query: jest.fn() } }));

const cdogsService = require('../../../../../src/components/cdogsService');
const fileService = require('../../../../../src/forms/file/service');
const storageService = require('../../../../../src/forms/file/storage/storageService');
const { Readable } = require('node:stream');

const { FileStorage, SubmissionMetadata } = require('../../../../../src/forms/common/models');
const packageBuilder = require('../../../../../src/forms/feature/submitToEmail/packageBuilder');
const { SystemUsers } = require('../../../../../src/forms/common/constants');

// chefsTemplate (real) reads submission.submission.submission.data + version.version
const submission = () => ({
  submission: { id: 's', confirmationId: 'ABC12345', submission: { data: {} } },
  version: { version: 1 },
});

beforeEach(() => {
  jest.clearAllMocks();
  cdogsService.templateUploadAndRender.mockResolvedValue({ data: Buffer.from('pdf-bytes') });
});

describe('renderReport', () => {
  it('names the report <template base>-<confirmationId>.<convertTo>', async () => {
    const template = { filename: 'My Template.docx', template: Buffer.from('tpl') };

    const result = await packageBuilder.renderReport({ submission: submission(), template });

    expect(result.filename).toBe('My Template-ABC12345.pdf');
    // the same name (sans extension) is passed to CDOGS as reportName
    expect(cdogsService.templateUploadAndRender.mock.calls[0][0].options.reportName).toBe('My Template-ABC12345');
  });

  it('sanitizes the template name and honours convertTo', async () => {
    const template = { filename: 'a/b:c.docx', template: Buffer.from('tpl') };

    const result = await packageBuilder.renderReport({ submission: submission(), template, convertTo: 'docx' });

    expect(result.filename).toBe('a_b_c-ABC12345.docx');
  });
});

describe('uploadPackage', () => {
  it('creates the file, moves it into permanent storage, and tracks the new path', async () => {
    fileService.create.mockResolvedValue({ id: 'file-1', path: '/tmp/abc-p.zip' });
    storageService.move.mockResolvedValue('myfiles/submission-packages/file-1');
    const patchAndFetchById = jest.fn().mockResolvedValue({ id: 'file-1', path: 'myfiles/submission-packages/file-1' });
    FileStorage.query.mockReturnValue({ patchAndFetchById });

    const result = await packageBuilder.uploadPackage({ filename: 'p.zip', contentType: 'application/zip', buffer: Buffer.from('zip-bytes') });

    // stored with the worker as createdBy, so a package is never taken for an anonymous upload
    expect(fileService.create).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ usernameIdp: SystemUsers.SUBMISSION_PACKAGE_WORKER }), 'uploads');
    // relocated out of the upload temp into the package folder
    expect(storageService.move).toHaveBeenCalledWith({ id: 'file-1', path: '/tmp/abc-p.zip' }, 'submission-packages');
    // record's path/storage updated to the permanent location, marked as a
    // package (the file read gate keeps package links open on this marker)
    expect(patchAndFetchById).toHaveBeenCalledWith(
      'file-1',
      expect.objectContaining({ path: 'myfiles/submission-packages/file-1', updatedBy: SystemUsers.SUBMISSION_PACKAGE_WORKER })
    );
    expect(SystemUsers.SUBMISSION_PACKAGE_WORKER).toBe('submission-package-worker');
    expect(result.path).toBe('myfiles/submission-packages/file-1');
  });

  it('throws if the move to permanent storage fails', async () => {
    fileService.create.mockResolvedValue({ id: 'file-1', path: '/tmp/abc-p.zip' });
    storageService.move.mockResolvedValue(undefined); // move failed

    await expect(packageBuilder.uploadPackage({ filename: 'p.zip', contentType: 'application/zip', buffer: Buffer.from('zip-bytes') })).rejects.toThrow(/permanent storage/);
  });
});

describe('getSubmissionFiles', () => {
  const ref = (id) => ({ originalName: `${id}.txt`, data: { id } });
  const IDS = {
    own: '11111111-1111-4111-8111-111111111111',
    sameForm: '22222222-2222-4222-8222-222222222222',
    otherForm: '33333333-3333-4333-8333-333333333333',
    pending: '44444444-4444-4444-8444-444444444444',
  };
  const ROWS = {
    [IDS.own]: { id: IDS.own, formSubmissionId: 'sub-1' },
    [IDS.sameForm]: { id: IDS.sameForm, formSubmissionId: 'sub-copied-from' },
    [IDS.otherForm]: { id: IDS.otherForm, formSubmissionId: 'sub-other-form' },
    [IDS.pending]: { id: IDS.pending, formSubmissionId: null },
  };
  const FORM_OF = { 'sub-1': 'form-1', 'sub-copied-from': 'form-1', 'sub-other-form': 'form-2' };
  const composite = (fileIds = Object.values(IDS)) => ({
    submission: { id: 'sub-1', submission: { data: { files: fileIds.map(ref) } } },
    form: { id: 'form-1' },
  });
  let ownerLookup;

  beforeEach(() => {
    // FileStorage.query().select().whereIn('id', ids).whereNotNull('formSubmissionId')
    FileStorage.query.mockImplementation(() => ({
      select: () => ({
        whereIn: (_col, ids) => ({ whereNotNull: async () => ids.map((id) => ROWS[id]).filter((row) => row?.formSubmissionId) }),
      }),
    }));
    // SubmissionMetadata.query().select().whereIn('submissionId', ids).where('formId', formId)
    ownerLookup = jest.fn(async (ids, formId) => ids.filter((id) => FORM_OF[id] === formId).map((submissionId) => ({ submissionId })));
    SubmissionMetadata.query.mockImplementation(() => ({
      select: () => ({ whereIn: (_col, ids) => ({ where: (_col2, formId) => ownerLookup(ids, formId) }) }),
    }));
    fileService.read.mockImplementation(async (id) => ROWS[id]);
    storageService.read.mockImplementation(async () => Readable.from([Buffer.from('bytes')]));
  });

  it('includes files on this submission and on another submission of the same form', async () => {
    const { files } = await packageBuilder.getSubmissionFiles(composite());

    expect(files.map((f) => f.id)).toEqual([IDS.own, IDS.sameForm]);
    expect(ownerLookup).toHaveBeenCalledWith(['sub-copied-from', 'sub-other-form'], 'form-1');
  });

  it('leaves out files on another form and files on no submission, without reading them', async () => {
    const { missing } = await packageBuilder.getSubmissionFiles(composite());

    expect(missing).toEqual([
      expect.objectContaining({ id: IDS.otherForm, reason: 'The file is not on a submission of this form.' }),
      expect.objectContaining({ id: IDS.pending, reason: 'The file is not on a submission of this form.' }),
    ]);
    expect(fileService.read).toHaveBeenCalledTimes(2);
    expect(storageService.read).toHaveBeenCalledTimes(2);
  });

  it('looks up no owners when every file is on this submission', async () => {
    const { files } = await packageBuilder.getSubmissionFiles(composite([IDS.own]));

    expect(files.map((f) => f.id)).toEqual([IDS.own]);
    expect(SubmissionMetadata.query).not.toHaveBeenCalled();
  });

  it('queries nothing when the submission names no files', async () => {
    const { files, missing } = await packageBuilder.getSubmissionFiles(composite([]));

    expect(files).toEqual([]);
    expect(missing).toEqual([]);
    expect(FileStorage.query).not.toHaveBeenCalled();
  });
});
