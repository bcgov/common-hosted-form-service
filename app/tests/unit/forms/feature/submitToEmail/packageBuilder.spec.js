jest.mock('../../../../../src/components/cdogsService', () => ({ templateUploadAndRender: jest.fn() }));
jest.mock('../../../../../src/forms/file/service', () => ({ create: jest.fn() }));
jest.mock('../../../../../src/forms/file/storage/storageService', () => ({ move: jest.fn() }));
jest.mock('../../../../../src/forms/common/models', () => ({ FileStorage: { query: jest.fn() } }));

const cdogsService = require('../../../../../src/components/cdogsService');
const fileService = require('../../../../../src/forms/file/service');
const storageService = require('../../../../../src/forms/file/storage/storageService');
const { FileStorage } = require('../../../../../src/forms/common/models');
const packageBuilder = require('../../../../../src/forms/feature/submitToEmail/packageBuilder');

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

    expect(fileService.create).toHaveBeenCalled();
    // relocated out of the upload temp into the package folder
    expect(storageService.move).toHaveBeenCalledWith({ id: 'file-1', path: '/tmp/abc-p.zip' }, 'submission-packages');
    // record's path/storage updated to the permanent location
    expect(patchAndFetchById).toHaveBeenCalledWith('file-1', expect.objectContaining({ path: 'myfiles/submission-packages/file-1' }));
    expect(result.path).toBe('myfiles/submission-packages/file-1');
  });

  it('throws if the move to permanent storage fails', async () => {
    fileService.create.mockResolvedValue({ id: 'file-1', path: '/tmp/abc-p.zip' });
    storageService.move.mockResolvedValue(undefined); // move failed

    await expect(packageBuilder.uploadPackage({ filename: 'p.zip', contentType: 'application/zip', buffer: Buffer.from('zip-bytes') })).rejects.toThrow(/permanent storage/);
  });
});
