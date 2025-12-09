const fs = require('node:fs');
const path = require('node:path');

jest.mock('node:fs');
jest.mock('node:path');

// Mock config with a factory function
const mockConfig = {
  has: jest.fn(),
  get: jest.fn(),
};

jest.mock('config', () => mockConfig);

const MODULE_PATH = '../../../../../src/webcomponents/v1/assets/assetRouteUtils';
const { trySend, createAssetRoute } = require(MODULE_PATH);

describe('assetRouteUtils', () => {
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    // Mock path.join to return predictable paths
    path.join.mockImplementation((...args) => args.join('/'));

    jest.clearAllMocks();
  });

  describe('assetRoots', () => {
    it('should return empty array when config has no roots', () => {
      mockConfig.has.mockReturnValue(false);

      // Re-require to get fresh assetRoots
      jest.resetModules();
      const { assetRoots: freshAssetRoots } = require(MODULE_PATH);

      expect(freshAssetRoots).toEqual([]);
    });

    it('should return array when config has array roots', () => {
      const roots = ['/path1', '/path2'];
      mockConfig.has.mockReturnValue(true);
      mockConfig.get.mockReturnValue(roots);

      jest.resetModules();
      const { assetRoots: freshAssetRoots } = require(MODULE_PATH);

      expect(freshAssetRoots).toEqual(roots);
    });

    it('should parse comma-separated string roots', () => {
      const rootsString = '/path1, /path2 , /path3';
      const expected = ['/path1', '/path2', '/path3'];
      mockConfig.has.mockReturnValue(true);
      mockConfig.get.mockReturnValue(rootsString);

      jest.resetModules();
      const { assetRoots: freshAssetRoots } = require(MODULE_PATH);

      expect(freshAssetRoots).toEqual(expected);
    });

    it('should filter empty strings from comma-separated roots', () => {
      const rootsString = '/path1, , /path2,';
      const expected = ['/path1', '/path2'];
      mockConfig.has.mockReturnValue(true);
      mockConfig.get.mockReturnValue(rootsString);

      jest.resetModules();
      const { assetRoots: freshAssetRoots } = require(MODULE_PATH);

      expect(freshAssetRoots).toEqual(expected);
    });

    it('should return empty array for empty string', () => {
      mockConfig.has.mockReturnValue(true);
      mockConfig.get.mockReturnValue('');

      jest.resetModules();
      const { assetRoots: freshAssetRoots } = require(MODULE_PATH);

      expect(freshAssetRoots).toEqual([]);
    });
  });

  describe('trySend', () => {
    it('should send file when it exists', () => {
      const filePath = '/test/file.css';
      const contentType = 'text/css';
      const mockStream = { pipe: jest.fn() };

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
      const filePath = '/test/file.css';
      const mockStream = { pipe: jest.fn() };

      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      trySend(mockRes, filePath);

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
  });

  describe('createAssetRoute', () => {
    it('should return a function', () => {
      const route = createAssetRoute('test.css', 'text/css', 'Not found');
      expect(typeof route).toBe('function');
    });

    it('should send file when found in first root', async () => {
      const relPath = 'vendor/test.css';
      const contentType = 'text/css';
      const errorMessage = 'Not found';
      const mockStream = { pipe: jest.fn() };
      const testRoots = ['/root1', '/root2'];

      // Mock file exists and stream
      fs.existsSync.mockImplementation((path) => path === '/root1/vendor/test.css');
      fs.createReadStream.mockReturnValue(mockStream);

      const route = createAssetRoute(relPath, contentType, errorMessage, testRoots);
      await route({}, mockRes, mockNext);

      // Test the behavior - file was sent successfully
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', contentType);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should try multiple roots until file is found', async () => {
      const relPath = 'vendor/test.css';
      const contentType = 'text/css';
      const errorMessage = 'Not found';
      const mockStream = { pipe: jest.fn() };
      const testRoots = ['/root1', '/root2', '/root3'];

      // Mock file exists in second root
      fs.existsSync.mockImplementation((path) => path === '/root2/vendor/test.css');
      fs.createReadStream.mockReturnValue(mockStream);

      const route = createAssetRoute(relPath, contentType, errorMessage, testRoots);
      await route({}, mockRes, mockNext);

      // Test the behavior - file was found in second root
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', contentType);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 404 when file not found in any root', async () => {
      const relPath = 'vendor/nonexistent.css';
      const contentType = 'text/css';
      const errorMessage = 'File not found';
      const testRoots = ['/root1', '/root2'];

      // Mock file does not exist
      fs.existsSync.mockReturnValue(false);

      const route = createAssetRoute(relPath, contentType, errorMessage, testRoots);
      await route({}, mockRes, mockNext);

      // Test the behavior - 404 response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ detail: errorMessage });
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    it('should call next with error when exception occurs', async () => {
      const relPath = 'vendor/test.css';
      const contentType = 'text/css';
      const errorMessage = 'Not found';
      const testError = new Error('Test error');
      const testRoots = ['/root1'];

      // Mock fs.existsSync to throw error
      fs.existsSync.mockImplementation(() => {
        throw testError;
      });

      const route = createAssetRoute(relPath, contentType, errorMessage, testRoots);
      await route({}, mockRes, mockNext);

      // Test the behavior - error passed to next
      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should not set content type when not provided', async () => {
      const relPath = 'vendor/test.css';
      const errorMessage = 'Not found';
      const mockStream = { pipe: jest.fn() };
      const testRoots = ['/root1'];

      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue(mockStream);

      const route = createAssetRoute(relPath, null, errorMessage, testRoots);
      await route({}, mockRes, mockNext);

      // Test the behavior - no content type set
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Content-Type', expect.any(String));
    });
  });
});
