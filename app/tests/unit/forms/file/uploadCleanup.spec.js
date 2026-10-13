const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const mockSelect = jest.fn().mockResolvedValue([]);

jest.mock('../../../../src/components/log', () => () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../../../src/forms/common/models', () => ({
  FileStorage: {
    query: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const { fileUpload } = require('../../../../src/forms/file/middleware/upload');
const uploadCleanup = require('../../../../src/forms/file/uploadCleanup');

const createTempUploadDir = async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-cleanup-test-'));
  fileUpload.init({ dir });
  return dir;
};

beforeEach(async () => {
  mockSelect.mockResolvedValue([]);
});

afterEach(async () => {
  jest.useRealTimers();
});

describe('resolveUploadPath', () => {
  it('resolves a file within the upload directory', async () => {
    const dir = await createTempUploadDir();
    const filePath = path.join(dir, 'test-file.txt');
    await fs.writeFile(filePath, 'data');

    const resolved = uploadCleanup.resolveUploadPath(filePath, dir);

    expect(resolved).toBe(fs.realpathSync(filePath));
  });

  it('rejects paths outside the upload directory', async () => {
    const dir = await createTempUploadDir();

    expect(() => uploadCleanup.resolveUploadPath('/etc/passwd', dir)).toThrow('Invalid file path: /etc/passwd is outside the allowed directory.');
  });

  it('rejects prefix bypass paths (e.g. /tmp vs /tmp2)', async () => {
    const dir = await createTempUploadDir();
    const sibling = `${dir}2`;
    await fs.ensureDir(sibling);

    expect(() => uploadCleanup.resolveUploadPath(path.join(sibling, 'evil.txt'), dir)).toThrow(/outside the allowed directory/);

    await fs.remove(sibling);
  });
});

describe('removeUploadedFile', () => {
  it('removes an existing file and returns true', async () => {
    const dir = await createTempUploadDir();
    const filePath = path.join(dir, 'remove-me.txt');
    await fs.writeFile(filePath, 'data');

    const result = await uploadCleanup.removeUploadedFile(filePath, 'test');

    expect(result).toBe(true);
    expect(await fs.pathExists(filePath)).toBe(false);
  });

  it('returns false for missing files without throwing', async () => {
    await createTempUploadDir();

    const result = await uploadCleanup.removeUploadedFile(path.join(fileUpload.getFileUploadsDir(), 'missing.txt'), 'test');

    expect(result).toBe(false);
  });

  it('returns false for paths outside the upload directory', async () => {
    await createTempUploadDir();
    const outside = path.join(os.tmpdir(), `outside-${Date.now()}.txt`);
    await fs.writeFile(outside, 'data');

    const result = await uploadCleanup.removeUploadedFile(outside, 'test');

    expect(result).toBe(false);
    expect(await fs.pathExists(outside)).toBe(true);
    await fs.remove(outside);
  });
});

describe('sweepUploadDir', () => {
  it('deletes stale unreferenced files', async () => {
    const dir = await createTempUploadDir();
    const staleFile = path.join(dir, 'stale.txt');
    await fs.writeFile(staleFile, 'old');
    const oldTime = Date.now() - 2 * 60 * 60 * 1000;
    await fs.utimes(staleFile, oldTime / 1000, oldTime / 1000);

    const result = await uploadCleanup.sweepUploadDir({
      olderThanMs: 60 * 60 * 1000,
      batchSize: 100,
    });

    expect(result.deleted).toBe(1);
    expect(await fs.pathExists(staleFile)).toBe(false);
  });

  it('skips files referenced in FileStorage', async () => {
    const dir = await createTempUploadDir();
    const referencedFile = path.join(dir, 'referenced.txt');
    await fs.writeFile(referencedFile, 'keep');
    const oldTime = Date.now() - 2 * 60 * 60 * 1000;
    await fs.utimes(referencedFile, oldTime / 1000, oldTime / 1000);

    mockSelect.mockResolvedValue([{ path: referencedFile }]);

    const result = await uploadCleanup.sweepUploadDir({
      olderThanMs: 60 * 60 * 1000,
      batchSize: 100,
    });

    expect(result.deleted).toBe(0);
    expect(await fs.pathExists(referencedFile)).toBe(true);
  });

  it('does not delete recent files', async () => {
    const dir = await createTempUploadDir();
    const recentFile = path.join(dir, 'recent.txt');
    await fs.writeFile(recentFile, 'new');

    const result = await uploadCleanup.sweepUploadDir({
      olderThanMs: 60 * 60 * 1000,
      batchSize: 100,
    });

    expect(result.deleted).toBe(0);
    expect(await fs.pathExists(recentFile)).toBe(true);
  });

  it('only scans the configured upload dir and leaves sibling directories untouched', async () => {
    const dir = await createTempUploadDir();
    const sibling = `${dir}-sibling`;
    await fs.ensureDir(sibling);
    const outsideFile = path.join(sibling, 'stale.txt');
    await fs.writeFile(outsideFile, 'old');
    const oldTime = Date.now() - 2 * 60 * 60 * 1000;
    await fs.utimes(outsideFile, oldTime / 1000, oldTime / 1000);

    const result = await uploadCleanup.sweepUploadDir({
      olderThanMs: 60 * 60 * 1000,
      batchSize: 100,
    });

    expect(result.deleted).toBe(0);
    expect(await fs.pathExists(outsideFile)).toBe(true);

    await fs.remove(sibling);
  });
});

describe('startUploadCleanupScheduler', () => {
  afterEach(() => {
    uploadCleanup.stopUploadCleanupScheduler();
  });

  it('registers startup and interval timers when enabled', () => {
    jest.useFakeTimers();
    uploadCleanup.startUploadCleanupScheduler({
      enabled: true,
      staleAgeMinutes: 60,
      intervalMinutes: 1,
      batchSize: 100,
    });

    expect(jest.getTimerCount()).toBe(2);

    uploadCleanup.stopUploadCleanupScheduler();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not start when disabled', () => {
    jest.useFakeTimers();
    uploadCleanup.startUploadCleanupScheduler({ enabled: false });
    expect(jest.getTimerCount()).toBe(0);
  });
});
