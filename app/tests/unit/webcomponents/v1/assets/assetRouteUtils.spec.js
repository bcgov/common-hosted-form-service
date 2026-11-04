const fs = require('node:fs');
const path = require('node:path');

jest.mock('node:fs');

const { assetsDir, trySend, createAssetRoute, createFileRoute } = require('../../../../../src/webcomponents/v1/assets/assetRouteUtils');

describe('assetRouteUtils', () => {
  let mockRes;
  let mockNext;
  let mockStream;

  beforeEach(() => {
    jest.resetAllMocks();
    mockRes = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    mockStream = { pipe: jest.fn(), on: jest.fn() };
  });

  describe('assetsDir', () => {
    it('points at the frozen v1 release assets', () => {
      expect(assetsDir).toBe(path.resolve(__dirname, '../../../../../embed/releases/v1/assets'));
    });
  });

  describe('trySend', () => {
    it('should send file when it exists', () => {
      const filePath = '/test/file.css';
      const contentType = 'text/css';

      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      const result = trySend(mockRes, filePath, contentType);

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', contentType);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(fs.createReadStream).toHaveBeenCalledWith(filePath);
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it('should not set content type when not provided', () => {
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      trySend(mockRes, '/test/file.css');

      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Content-Type', expect.any(String));
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
    });

    it('should return false when file does not exist', () => {
      const filePath = '/test/nonexistent.css';

      fs.existsSync.mockReturnValue(false);

      const result = trySend(mockRes, filePath, 'text/css');

      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(fs.createReadStream).not.toHaveBeenCalled();
    });

    it('answers a read error with an uncacheable 500 instead of crashing', () => {
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      trySend(mockRes, '/test/file.css', 'text/css');
      const onError = mockStream.on.mock.calls.find(([event]) => event === 'error')[1];
      onError(Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' }));

      expect(mockRes.removeHeader).toHaveBeenCalledWith('Content-Type');
      expect(mockRes.setHeader).toHaveBeenLastCalledWith('Cache-Control', 'no-store');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ detail: 'Asset could not be read' });
    });

    it('closes the response when a read error happens mid-stream', () => {
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);
      mockRes.headersSent = true;
      mockRes.destroy = jest.fn();

      trySend(mockRes, '/test/file.css', 'text/css');
      mockStream.on.mock.calls.find(([event]) => event === 'error')[1](new Error('EIO'));

      expect(mockRes.destroy).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('createAssetRoute', () => {
    it('should send file from the given root', async () => {
      fs.existsSync.mockImplementation((p) => p === '/root1/vendor/test.css');
      fs.createReadStream.mockReturnValue(mockStream);

      const route = createAssetRoute('vendor/test.css', 'text/css', 'Not found', '/root1');
      await route({}, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/css');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should default to the v1 assets directory', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      const route = createAssetRoute('test.css', 'text/css', 'Not found');
      await route({}, mockRes, mockNext);

      expect(fs.existsSync).toHaveBeenCalledWith(path.join(assetsDir, 'test.css'));
    });

    it('should return 404 when file not found', async () => {
      fs.existsSync.mockReturnValue(false);

      const route = createAssetRoute('vendor/nonexistent.css', 'text/css', 'File not found', '/root1');
      await route({}, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ detail: 'File not found' });
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    it('should call next with error when exception occurs', async () => {
      const testError = new Error('Test error');
      fs.existsSync.mockImplementation(() => {
        throw testError;
      });

      const route = createAssetRoute('vendor/test.css', 'text/css', 'Not found', '/root1');
      await route({}, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should not set content type when not provided', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      const route = createAssetRoute('vendor/test.css', null, 'Not found', '/root1');
      await route({}, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Content-Type', expect.any(String));
    });
  });

  describe('createFileRoute', () => {
    const route = () => createFileRoute('fonts', 'Invalid path', 'File not found', '/root1');

    it.each([
      ['font.woff2', 'font/woff2'],
      ['font.WOFF', 'font/woff'],
      ['font.ttf', 'font/ttf'],
      ['font.eot', 'application/vnd.ms-fontobject'],
      ['font.otf', 'font/otf'],
      ['sprite.svg', 'image/svg+xml'],
      ['file.bin', 'application/octet-stream'],
    ])('should send %s as %s', async (file, contentType) => {
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      await route()({ params: { file } }, mockRes, mockNext);

      expect(fs.existsSync).toHaveBeenCalledWith(`/root1/fonts/${file}`);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', contentType);
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it.each(['', 'bad$name.woff', 'a..b.woff', '.', '..'])('should return 400 for file name %p', async (file) => {
      await route()({ params: { file } }, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ detail: 'Invalid path' });
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('should return 404 when file not found', async () => {
      fs.existsSync.mockReturnValue(false);

      await route()({ params: { file: 'missing.woff' } }, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ detail: 'File not found' });
    });

    it('should call next with error when exception occurs', async () => {
      const testError = new Error('Test error');
      fs.existsSync.mockImplementation(() => {
        throw testError;
      });

      await route()({ params: { file: 'font.woff' } }, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
