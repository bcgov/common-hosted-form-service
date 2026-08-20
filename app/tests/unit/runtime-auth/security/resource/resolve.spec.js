/* eslint-env jest */

// Path constants for easier maintenance
// Test file is at: tests/unit/runtime-auth/security/resource/resolve.spec.js
// Source files are at: src/runtime-auth/security/resource/...
// Path: ../../../../../ (5 levels up from resource/ to app/, then down to src/)
const RESOLVE_PATH = '../../../../../src/runtime-auth/security/resource/resolve';

// Mock dependencies - must use string literals (jest.mock is hoisted)
jest.mock('../../../../../src/runtime-auth/security/logger', () => ({
  resourceResolver: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Helper functions for requiring modules
function requireResolve() {
  return require(RESOLVE_PATH);
}

describe('resource/resolve', () => {
  let makeResourceResolver;
  let mockLogger;
  let mockFormService;
  let mockSubmissionService;
  let mockFileService;

  beforeEach(() => {
    jest.clearAllMocks();
    makeResourceResolver = requireResolve();
    mockLogger = require('../../../../../src/runtime-auth/security/logger').resourceResolver;

    mockFormService = {
      readForm: jest.fn(),
    };

    mockSubmissionService = {
      read: jest.fn(),
    };

    mockFileService = {
      read: jest.fn(),
    };
  });

  function makeDeps(overrides = {}) {
    return {
      services: {
        formService: mockFormService,
        submissionService: mockSubmissionService,
        fileService: mockFileService,
        ...overrides.services,
      },
      ...overrides,
    };
  }

  describe('makeResourceResolver', () => {
    it('should return resolver with resolve function', () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      expect(resolver).toHaveProperty('resolve');
      expect(typeof resolver.resolve).toBe('function');
    });
  });

  describe('resolve - none', () => {
    it('should return empty resource for none kind', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/test' };
      const policy = { resourceSpec: { kind: 'none' } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toEqual({
        form: null,
        submission: null,
        file: null,
        publicForm: false,
        activeForm: false,
      });
    });

    it('should default to none when resourceSpec not provided', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/test' };
      const policy = {};

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toEqual({
        form: null,
        submission: null,
        file: null,
        publicForm: false,
        activeForm: false,
      });
    });

    it('should default to none when resourceSpec.kind is unknown', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/test' };
      const policy = { resourceSpec: { kind: 'unknownKind' } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toEqual({
        form: null,
        submission: null,
        file: null,
        publicForm: false,
        activeForm: false,
      });
    });
  });

  describe('resolve - formOnly', () => {
    it('should resolve form resource', async () => {
      const mockForm = { id: 'form-123', name: 'Test Form', active: true };
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(mockFormService.readForm).toHaveBeenCalledWith('form-123');
      expect(result.form).toEqual(mockForm);
      expect(result.submission).toBeNull();
      expect(result.file).toBeNull();
      expect(result.activeForm).toBe(true);
    });

    it('should return null when formId not provided', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms' };
      const policy = { resourceSpec: { kind: 'formOnly', params: {} } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
      expect(mockFormService.readForm).not.toHaveBeenCalled();
    });

    it('should return null when form not found', async () => {
      mockFormService.readForm.mockResolvedValue(null);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should return null when formService.readForm throws error', async () => {
      mockFormService.readForm.mockRejectedValue(new Error('Form not found'));

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should throw error when formService is missing', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps({ services: { formService: null } }) });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      await expect(resolver.resolve(req, {}, policy)).rejects.toThrow();
    });

    it('should throw error when formService.readForm is not a function', async () => {
      const resolver = makeResourceResolver({
        deps: makeDeps({ services: { formService: { readForm: 'not-a-function' } } }),
      });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      await expect(resolver.resolve(req, {}, policy)).rejects.toThrow();
    });
  });

  describe('resolve - submissionFromForm', () => {
    it('should resolve submission with form', async () => {
      const mockSubmissionData = {
        submission: { id: 'sub-456', formSubmissionId: 'sub-456' },
        form: { id: 'form-123', name: 'Test Form' },
      };
      mockSubmissionService.read.mockResolvedValue(mockSubmissionData);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456' };
      const policy = {
        resourceSpec: { kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(mockSubmissionService.read).toHaveBeenCalledWith('sub-456');
      expect(result.form).toEqual(mockSubmissionData.form);
      expect(result.submission).toEqual(mockSubmissionData.submission);
      expect(result.file).toBeNull();
    });

    it('should return null when submissionId not provided', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions' };
      const policy = { resourceSpec: { kind: 'submissionFromForm', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
      expect(mockSubmissionService.read).not.toHaveBeenCalled();
    });

    it('should return null when formId does not match', async () => {
      const mockSubmissionData = {
        submission: { id: 'sub-456' },
        form: { id: 'form-999' },
      };
      mockSubmissionService.read.mockResolvedValue(mockSubmissionData);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456' };
      const policy = {
        resourceSpec: { kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should allow submission when formId not provided in params', async () => {
      const mockSubmissionData = {
        submission: { id: 'sub-456' },
        form: { id: 'form-123' },
      };
      mockSubmissionService.read.mockResolvedValue(mockSubmissionData);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/submissions/456' };
      const policy = { resourceSpec: { kind: 'submissionFromForm', params: { submissionId: 'sub-456' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).not.toBeNull();
      expect(result.form).toEqual(mockSubmissionData.form);
    });

    it('should return null when submission not found', async () => {
      mockSubmissionService.read.mockResolvedValue(null);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456' };
      const policy = {
        resourceSpec: { kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should return null when submissionData.form is missing', async () => {
      mockSubmissionService.read.mockResolvedValue({ submission: { id: 'sub-456' } });

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456' };
      const policy = {
        resourceSpec: { kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should return null when submissionService.read throws error', async () => {
      mockSubmissionService.read.mockRejectedValue(new Error('Submission not found'));

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456' };
      const policy = {
        resourceSpec: { kind: 'submissionFromForm', params: { formId: 'form-123', submissionId: 'sub-456' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('resolve - file', () => {
    it('should resolve submitted file with submission and form', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: 'sub-456' };
      const mockSubmissionData = {
        submission: { id: 'sub-456' },
        form: { id: 'form-123' },
      };
      const mockForm = { id: 'form-123', name: 'Test Form' };

      mockFileService.read.mockResolvedValue(mockFile);
      mockSubmissionService.read.mockResolvedValue(mockSubmissionData);
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files/789' };
      const policy = { resourceSpec: { kind: 'file', params: { fileId: 'file-789' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(mockFileService.read).toHaveBeenCalledWith('file-789');
      expect(mockSubmissionService.read).toHaveBeenCalledWith('sub-456');
      expect(mockFormService.readForm).toHaveBeenCalledWith('form-123');
      expect(result.file).toEqual(mockFile);
      expect(result.submission).toEqual(mockSubmissionData.submission);
      expect(result.form).toEqual(mockForm);
    });

    it('should resolve draft file without submission', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: null };

      mockFileService.read.mockResolvedValue(mockFile);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files/789' };
      const policy = { resourceSpec: { kind: 'file', params: { fileId: 'file-789' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(mockFileService.read).toHaveBeenCalledWith('file-789');
      expect(result.file).toEqual(mockFile);
      expect(result.form).toBeNull();
      expect(result.submission).toBeNull();
    });

    it('should return null when fileId not provided', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files' };
      const policy = { resourceSpec: { kind: 'file', params: {} } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
      expect(mockFileService.read).not.toHaveBeenCalled();
    });

    it('should return null when file not found', async () => {
      mockFileService.read.mockResolvedValue(null);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files/789' };
      const policy = { resourceSpec: { kind: 'file', params: { fileId: 'file-789' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should return null when submission not found for submitted file', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: 'sub-456' };
      mockFileService.read.mockResolvedValue(mockFile);
      mockSubmissionService.read.mockResolvedValue(null);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files/789' };
      const policy = { resourceSpec: { kind: 'file', params: { fileId: 'file-789' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should return null when form not found for submitted file', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: 'sub-456' };
      const mockSubmissionData = {
        submission: { id: 'sub-456' },
        form: { id: 'form-123' },
      };

      mockFileService.read.mockResolvedValue(mockFile);
      mockSubmissionService.read.mockResolvedValue(mockSubmissionData);
      mockFormService.readForm.mockResolvedValue(null);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files/789' };
      const policy = { resourceSpec: { kind: 'file', params: { fileId: 'file-789' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });
  });

  describe('resolve - fileFromSubmission', () => {
    it('should resolve submitted file with validation', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: 'sub-456' };
      const mockSubmissionData = {
        submission: { id: 'sub-456' },
        form: { id: 'form-123' },
      };

      mockFileService.read.mockResolvedValue(mockFile);
      mockSubmissionService.read.mockResolvedValue(mockSubmissionData);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456/files/789' };
      const policy = {
        resourceSpec: {
          kind: 'fileFromSubmission',
          params: { formId: 'form-123', submissionId: 'sub-456', fileId: 'file-789' },
        },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).not.toBeNull();
      expect(result.file).toEqual(mockFile);
    });

    it('should return null when file submissionId does not match url submissionId', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: 'sub-999' };

      mockFileService.read.mockResolvedValue(mockFile);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456/files/789' };
      const policy = {
        resourceSpec: {
          kind: 'fileFromSubmission',
          params: { formId: 'form-123', submissionId: 'sub-456', fileId: 'file-789' },
        },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should resolve draft file with formId', async () => {
      const mockFile = { id: 'file-789', formId: 'form-123', formSubmissionId: null };
      const mockForm = { id: 'form-123', name: 'Test Form' };

      mockFileService.read.mockResolvedValue(mockFile);
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/files/789' };
      const policy = {
        resourceSpec: { kind: 'fileFromSubmission', params: { formId: 'form-123', fileId: 'file-789' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).not.toBeNull();
      expect(result.file).toEqual(mockFile);
      expect(result.form).toEqual(mockForm);
    });

    it('should return null when draft file formId does not match', async () => {
      const mockFile = { id: 'file-789', formId: 'form-999', formSubmissionId: null };

      mockFileService.read.mockResolvedValue(mockFile);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/files/789' };
      const policy = {
        resourceSpec: { kind: 'fileFromSubmission', params: { formId: 'form-123', fileId: 'file-789' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });

    it('should return null when fileId not provided', async () => {
      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123/submissions/456/files' };
      const policy = {
        resourceSpec: { kind: 'fileFromSubmission', params: { formId: 'form-123', submissionId: 'sub-456' } },
      };

      const result = await resolver.resolve(req, {}, policy);

      expect(result).toBeNull();
    });
  });

  describe('resolve - publicForm detection', () => {
    it('should detect public form when identityProviders includes public', async () => {
      const mockForm = {
        id: 'form-123',
        name: 'Public Form',
        identityProviders: [{ code: 'public' }, { code: 'idir' }],
      };
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result.publicForm).toBe(true);
    });

    it('should not detect public form when identityProviders does not include public', async () => {
      const mockForm = {
        id: 'form-123',
        name: 'Private Form',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }],
      };
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result.publicForm).toBe(false);
    });

    it('should not detect public form when identityProviders is missing', async () => {
      const mockForm = { id: 'form-123', name: 'Form' };
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      const result = await resolver.resolve(req, {}, policy);

      expect(result.publicForm).toBe(false);
    });
  });

  describe('resolve - backward compatibility', () => {
    it('should set req.currentFileRecord when file is resolved', async () => {
      const mockFile = { id: 'file-789', formSubmissionId: null };
      mockFileService.read.mockResolvedValue(mockFile);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/files/789' };
      const policy = { resourceSpec: { kind: 'file', params: { fileId: 'file-789' } } };

      await resolver.resolve(req, {}, policy);

      expect(req.currentFileRecord).toEqual(mockFile);
    });

    it('should not set req.currentFileRecord when no file is resolved', async () => {
      const mockForm = { id: 'form-123' };
      mockFormService.readForm.mockResolvedValue(mockForm);

      const resolver = makeResourceResolver({ deps: makeDeps() });
      const req = { method: 'GET', path: '/forms/123' };
      const policy = { resourceSpec: { kind: 'formOnly', params: { formId: 'form-123' } } };

      await resolver.resolve(req, {}, policy);

      expect(req.currentFileRecord).toBeUndefined();
    });
  });
});
