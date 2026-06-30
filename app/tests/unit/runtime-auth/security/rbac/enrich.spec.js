/* eslint-env jest */

// Path constants for easier maintenance
// Test file is at: tests/unit/runtime-auth/security/rbac/enrich.spec.js
// Source files are at: src/runtime-auth/security/rbac/...
// Path: ../../../../../ (5 levels up from rbac/ to app/, then down to src/)
const ENRICH_PATH = '../../../../../src/runtime-auth/security/rbac/enrich';
const CONSTANTS_PATH = '../../../../../src/forms/common/constants';

// Mock dependencies - must use string literals (jest.mock is hoisted)
jest.mock('../../../../../src/runtime-auth/security/logger', () => ({
  enrichRBAC: {
    info: jest.fn(),
  },
}));

// Helper functions for requiring modules
function requireEnrich() {
  return require(ENRICH_PATH);
}

function requireConstants() {
  return require(CONSTANTS_PATH);
}

describe('rbac/enrich', () => {
  let makeEnrichRBAC;
  let mockRbacService;
  let mockAuthService;
  let Permissions;

  beforeEach(() => {
    jest.clearAllMocks();
    makeEnrichRBAC = requireEnrich();
    Permissions = requireConstants().Permissions;

    mockRbacService = {
      readUserRole: jest.fn(),
    };

    mockAuthService = {
      getUserForms: jest.fn(),
      checkSubmissionPermission: jest.fn(),
    };
  });

  function makeDeps(overrides = {}) {
    return {
      services: {
        rbacService: mockRbacService,
        authService: mockAuthService,
        ...overrides.services,
      },
      constants: {
        Permissions,
        ...overrides.constants,
      },
      ...overrides,
    };
  }

  describe('makeEnrichRBAC', () => {
    it('should return enrichRBAC function', () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      expect(typeof enrichRBAC).toBe('function');
    });

    it('should use default constants when not provided', () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      expect(typeof enrichRBAC).toBe('function');
    });

    it('should use provided constants', () => {
      const customConstants = { Permissions: { FORM_READ: 'CUSTOM_READ' } };
      const enrichRBAC = makeEnrichRBAC({ deps: { services: {}, constants: customConstants } });
      expect(typeof enrichRBAC).toBe('function');
    });
  });

  describe('enrichRBAC - API users', () => {
    it('should grant comprehensive permissions to API users', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
        },
      };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(result.permissions).toContain(Permissions.FORM_READ);
      expect(result.permissions).toContain(Permissions.FORM_UPDATE);
      expect(result.permissions).toContain(Permissions.SUBMISSION_READ);
      expect(result.permissions).toContain(Permissions.DESIGN_READ);
      expect(result.permissions).toContain(Permissions.DOCUMENT_TEMPLATE_READ);
    });

    it('should record API_USER_FULL_ACCESS decision', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps({ services: {} }) });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'api', id: 'api-user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      const fullAccessDecision = result.decisions.find((d) => d.predicate === 'apiUserFullAccess');
      expect(fullAccessDecision).toBeDefined();
      expect(fullAccessDecision.result).toBe(true);
    });

    it('should record API_USER_DATABASE_SKIP decision', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps({ services: {} }) });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'api', id: 'api-user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      const skipDecision = result.decisions.find((d) => d.predicate === 'apiUserDatabaseSkip');
      expect(skipDecision).toBeDefined();
      expect(skipDecision.result).toBe(true);
    });

    it('should not call database services for API users', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'api', id: 'api-user-123' } };
      const resource = { form: { id: 'form-123' } };

      await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(mockRbacService.readUserRole).not.toHaveBeenCalled();
      expect(mockAuthService.getUserForms).not.toHaveBeenCalled();
      expect(mockAuthService.checkSubmissionPermission).not.toHaveBeenCalled();
    });

    it('should grant file permissions to API users with file access', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: ['SUBMISSION_READ'] };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
          metadata: { filesApiAccess: true },
        },
      };
      // Submitted file (has formSubmissionId) - API users can access these if filesApiAccess !== false
      const resource = { file: { id: 'file-123', formSubmissionId: 'submission-123' } };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(result.permissions).toContain(Permissions.SUBMISSION_READ);
      const fileAccessDecision = result.decisions.find((d) => d.predicate === 'apiUserFileAccess');
      expect(fileAccessDecision).toBeDefined();
      expect(fileAccessDecision.result).toBe(true);
    });

    it('should not record file create decision based on filesApiAccess', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], classification: 'api' };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
          metadata: { filesApiAccess: true },
        },
      };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      // filesApiAccess no longer affects file create decisions
      const fileCreateDecision = result.decisions.find((d) => d.predicate === 'apiUserFileCreate');
      expect(fileCreateDecision).toBeUndefined();
    });

    it('should record API_USER_FILE_API_ACCESS for existing files based on filesApiAccess', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = {
        requiredPermissions: [Permissions.SUBMISSION_READ],
        classification: 'api',
      };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
          metadata: { filesApiAccess: true },
        },
      };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      // filesApiAccess should still affect existing file access (read/update/delete)
      const fileApiAccessDecision = result.decisions.find((d) => d.predicate === 'apiUserFileApiAccess');
      expect(fileApiAccessDecision).toBeDefined();
      expect(fileApiAccessDecision.result).toBe(true);
    });

    it('should record API_USER_FILE_CREATE for API users with webcomponents classification', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = {
        requiredPermissions: [],
        classification: 'webcomponents',
        resourceSpec: { kind: 'formOnly' }, // Required to identify file creation scenario
      };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
        },
      };
      const resource = {}; // No file resource indicates file creation

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      const fileCreateDecision = result.decisions.find((d) => d.predicate === 'apiUserFileCreate');
      expect(fileCreateDecision).toBeDefined();
      expect(fileCreateDecision.result).toBe(true);
      // Note: classification is not stored in decision metadata, only fileApiAccess
    });

    it('should record API_USER_DRAFT_FILE_READ and API_USER_DRAFT_FILE_DELETE for API users with webcomponents classification and draft file', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      // Need SUBMISSION_READ for read and SUBMISSION_UPDATE for delete to trigger decisions
      const policy = {
        requiredPermissions: [Permissions.SUBMISSION_READ, Permissions.SUBMISSION_UPDATE],
        classification: 'webcomponents',
      };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
        },
      };
      const resource = {
        file: {
          id: 'file-123',
          formSubmissionId: null, // draft file
        },
      };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      const fileReadDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileRead');
      const fileDeleteDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileDelete');

      expect(fileReadDecision).toBeDefined();
      expect(fileReadDecision.result).toBe(true);

      expect(fileDeleteDecision).toBeDefined();
      expect(fileDeleteDecision.result).toBe(true);
    });

    it('should not record API_USER_DRAFT_FILE_READ or API_USER_DRAFT_FILE_DELETE for API users with webcomponents classification and submitted file', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], classification: 'webcomponents' };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
        },
      };
      const resource = {
        file: {
          id: 'file-123',
          formSubmissionId: 'submission-456', // submitted file
        },
      };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      const fileReadDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileRead');
      const fileDeleteDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileDelete');

      expect(fileReadDecision).toBeUndefined();
      expect(fileDeleteDecision).toBeUndefined();
    });

    it('should not record file exceptions for API users with non-webcomponents classification', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], classification: 'api' };
      const who = {
        actor: {
          type: 'api',
          id: 'api-user-123',
        },
      };
      const resource = {
        file: {
          id: 'file-123',
          formSubmissionId: null,
        },
      };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      const fileCreateDecision = result.decisions.find((d) => d.predicate === 'apiUserFileCreate');
      const fileReadDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileRead');
      const fileDeleteDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileDelete');

      expect(fileCreateDecision).toBeUndefined();
      expect(fileReadDecision).toBeUndefined();
      expect(fileDeleteDecision).toBeUndefined();
    });

    it('should not record file exceptions for non-API users', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], classification: 'webcomponents' };
      const who = {
        actor: {
          type: 'user',
          id: 'user-123',
        },
      };
      const resource = {
        file: {
          id: 'file-123',
          formSubmissionId: null,
        },
      };

      const result = await enrichRBAC({ policy, who, resource, currentUser: { id: 'user-123' }, apiUser: false });

      const fileCreateDecision = result.decisions.find((d) => d.predicate === 'apiUserFileCreate');
      const fileReadDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileRead');
      const fileDeleteDecision = result.decisions.find((d) => d.predicate === 'apiUserDraftFileDelete');

      expect(fileCreateDecision).toBeUndefined();
      expect(fileReadDecision).toBeUndefined();
      expect(fileDeleteDecision).toBeUndefined();
    });
  });

  describe('enrichRBAC - Public users', () => {
    it('should grant base permissions to public users', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      expect(result.permissions).toContain(Permissions.FORM_READ);
      expect(result.permissions).toContain(Permissions.SUBMISSION_CREATE);
      expect(result.permissions).toContain(Permissions.DOCUMENT_TEMPLATE_READ);
    });

    it('should record PUBLIC_USER_BASE_ACCESS decision', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      const baseAccessDecision = result.decisions.find((d) => d.predicate === 'publicUserBaseAccess');
      expect(baseAccessDecision).toBeDefined();
      expect(baseAccessDecision.result).toBe(true);
    });

    it('should grant SUBMISSION_READ on public forms when required', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [Permissions.SUBMISSION_READ] };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = { publicForm: true, form: { id: 'form-123' } };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      expect(result.permissions).toContain(Permissions.SUBMISSION_READ);
      const submissionReadDecision = result.decisions.find((d) => d.predicate === 'publicUserSubmissionRead');
      expect(submissionReadDecision).toBeDefined();
      expect(submissionReadDecision.result).toBe(true);
    });

    it('should not grant SUBMISSION_READ when multiple permissions required', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = {
        requiredPermissions: [Permissions.SUBMISSION_READ, Permissions.SUBMISSION_UPDATE],
      };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = { publicForm: true };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      expect(result.permissions).not.toContain(Permissions.SUBMISSION_READ);
    });

    it('should grant draft file permissions to public users on public forms', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [Permissions.SUBMISSION_CREATE] };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = {
        publicForm: true,
        file: { id: 'file-123', formSubmissionId: null },
      };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      expect(result.permissions).toContain(Permissions.SUBMISSION_CREATE);
      const draftFileDecision = result.decisions.find((d) => d.predicate === 'publicUserDraftFileAccess');
      expect(draftFileDecision).toBeDefined();
      expect(draftFileDecision.result).toBe(true);
    });

    it('should deny submitted file access to public users', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [Permissions.SUBMISSION_READ] };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = {
        publicForm: true,
        file: { id: 'file-123', formSubmissionId: 'sub-456' },
      };

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      const submittedFileDecision = result.decisions.find((d) => d.predicate === 'publicUserSubmittedFileAccess');
      expect(submittedFileDecision).toBeDefined();
      expect(submittedFileDecision.result).toBe(false);
    });

    it('should record PUBLIC_USER_DATABASE_SKIP decision', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'public', id: 'public-user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      const skipDecision = result.decisions.find((d) => d.predicate === 'publicUserDatabaseSkip');
      expect(skipDecision).toBeDefined();
      expect(skipDecision.result).toBe(true);
    });
  });

  describe('enrichRBAC - Authenticated users', () => {
    it('should load roles from database', async () => {
      const mockRoles = [{ role: 'form_designer' }, { role: 'form_submitter' }];
      mockRbacService.readUserRole.mockResolvedValue(mockRoles);

      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'user', id: 'user-123' } };
      const resource = { form: { id: 'form-123' } };

      const result = await enrichRBAC({ policy, who, resource, currentUser: { id: 'user-123' }, apiUser: false });

      expect(mockRbacService.readUserRole).toHaveBeenCalledWith('user-123', 'form-123');
      expect(result.roles).toContain('form_designer');
      expect(result.roles).toContain('form_submitter');
    });

    it('should load form permissions from database', async () => {
      const mockForms = [{ formId: 'form-123', permissions: [Permissions.FORM_READ, Permissions.FORM_UPDATE] }];
      mockAuthService.getUserForms.mockResolvedValue(mockForms);

      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'user', id: 'user-123' } };
      const resource = { form: { id: 'form-123' } };
      const currentUser = { id: 'user-123' };

      const result = await enrichRBAC({ policy, who, resource, currentUser, apiUser: false });

      expect(mockAuthService.getUserForms).toHaveBeenCalledWith({ id: 'user-123' }, { formId: 'form-123' });
      expect(result.permissions).toContain(Permissions.FORM_READ);
      expect(result.permissions).toContain(Permissions.FORM_UPDATE);
      const formPermsDecision = result.decisions.find((d) => d.predicate === 'hasFormPermissions');
      expect(formPermsDecision).toBeDefined();
      expect(formPermsDecision.result).toBe(true);
    });

    it('should load submission permissions from database', async () => {
      mockAuthService.checkSubmissionPermission.mockResolvedValue(true);

      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [Permissions.SUBMISSION_READ, Permissions.SUBMISSION_UPDATE] };
      const who = { actor: { type: 'user', id: 'user-123' } };
      const resource = { submission: { submissionId: 'sub-456' } };
      const currentUser = { id: 'user-123' };

      const result = await enrichRBAC({ policy, who, resource, currentUser, apiUser: false });

      expect(mockAuthService.checkSubmissionPermission).toHaveBeenCalledWith(currentUser, 'sub-456', [Permissions.SUBMISSION_READ, Permissions.SUBMISSION_UPDATE]);
      expect(result.permissions).toContain(Permissions.SUBMISSION_READ);
      expect(result.permissions).toContain(Permissions.SUBMISSION_UPDATE);
      const submissionPermsDecision = result.decisions.find((d) => d.predicate === 'hasSubmissionPermissions');
      expect(submissionPermsDecision).toBeDefined();
      expect(submissionPermsDecision.result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockRbacService.readUserRole.mockRejectedValue(new Error('Database error'));

      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'user', id: 'user-123' } };
      const resource = { form: { id: 'form-123' } };

      const result = await enrichRBAC({ policy, who, resource, currentUser: { id: 'user-123' }, apiUser: false });

      expect(result.roles).toEqual([]);
      const errorDecision = result.decisions.find((d) => d.predicate === 'readUserRole');
      expect(errorDecision).toBeDefined();
      expect(errorDecision.result).toBe(false);
    });

    it('should add admin role when actor.isAdmin is true', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'user', id: 'user-123', isAdmin: true } };
      const resource = { form: { id: 'form-123' } };

      const result = await enrichRBAC({ policy, who, resource, currentUser: { id: 'user-123' }, apiUser: false });

      expect(result.roles).toContain('admin');
    });

    it('should not add admin role when actor.isAdmin is false', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'user', id: 'user-123', isAdmin: false } };
      const resource = { form: { id: 'form-123' } };

      const result = await enrichRBAC({ policy, who, resource, currentUser: { id: 'user-123' }, apiUser: false });

      expect(result.roles).not.toContain('admin');
    });

    it('should skip database calls when resource has no form', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'user', id: 'user-123' } };
      const resource = {};

      await enrichRBAC({ policy, who, resource, currentUser: { id: 'user-123' }, apiUser: false });

      expect(mockRbacService.readUserRole).not.toHaveBeenCalled();
      expect(mockAuthService.getUserForms).not.toHaveBeenCalled();
    });

    it('should skip database calls when actor is not a user', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'gateway', id: 'gateway-123' } };
      const resource = { form: { id: 'form-123' } };

      await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: false });

      expect(mockRbacService.readUserRole).not.toHaveBeenCalled();
      expect(mockAuthService.getUserForms).not.toHaveBeenCalled();
    });
  });

  describe('enrichRBAC - return value', () => {
    it('should return actorId from who.actor.id', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: { type: 'api', id: 'user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(result.actorId).toBe('user-123');
    });

    it('should return actorId from who.actor when id not available', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [], resourceSpec: { kind: 'formOnly' } };
      const who = { actor: 'direct-actor-id' };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(result.actorId).toBe('direct-actor-id');
    });

    it('should return required permissions from policy', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: ['FORM_READ', 'FORM_UPDATE'] };
      const who = { actor: { type: 'api', id: 'user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(result.required).toEqual(['FORM_READ', 'FORM_UPDATE']);
    });

    it('should return empty required when policy has none', async () => {
      const enrichRBAC = makeEnrichRBAC({ deps: makeDeps() });
      const policy = { requiredPermissions: [] };
      const who = { actor: { type: 'api', id: 'user-123' } };
      const resource = {};

      const result = await enrichRBAC({ policy, who, resource, currentUser: null, apiUser: true });

      expect(result.required).toEqual([]);
    });
  });
});
