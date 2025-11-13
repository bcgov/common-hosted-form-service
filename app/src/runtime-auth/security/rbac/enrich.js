/**
 * CHEFS RBAC Enrichment
 * Queries database for roles and permissions, handles files and API users specially
 */

const securityLog = require('../logger');
const PREDICATES = require('../predicates');

async function loadRolesFromDatabase(resource, actor, rbacService, decisions) {
  if (!resource?.form || actor?.type !== 'user' || !rbacService?.readUserRole) return new Set();
  try {
    const formId = resource.form.id || resource.formId;
    const userRoles = await rbacService.readUserRole(actor.id, formId);
    return new Set(userRoles.map((r) => r.role));
  } catch (e) {
    decisions.push({ predicate: 'readUserRole', result: false, error: e.message });
    return new Set();
  }
}

async function loadFormPermissionsFromDatabase(resource, actor, authService, currentUser, decisions, decide) {
  if (!resource?.form || actor?.type !== 'user' || !authService?.getUserForms) return new Set();
  try {
    const formId = resource.form.id || resource.formId;
    const userId = currentUser?.id || actor.id;
    const forms = await authService.getUserForms({ ...currentUser, id: userId }, { formId });
    const form = forms.find((f) => f.formId === formId);
    if (form?.permissions) {
      decide(PREDICATES.HAS_FORM_PERMISSIONS, true, { permissions: form.permissions });
      return new Set(form.permissions);
    }
    decide(PREDICATES.HAS_FORM_PERMISSIONS, false, { formId });
  } catch (e) {
    decisions.push({ predicate: PREDICATES.GET_USER_FORMS, result: false, error: e.message });
  }
  return new Set();
}

async function loadSubmissionPermissionsFromDatabase(resource, actor, authService, currentUser, policy, decisions, decide) {
  if (!resource?.submission || actor?.type !== 'user' || !authService?.checkSubmissionPermission) return new Set();
  try {
    const submissionId = resource.submission.submissionId || resource.submissionId;
    const requiredPerms = policy.requiredPermissions || [];
    const hasPermission = await authService.checkSubmissionPermission(currentUser, submissionId, requiredPerms);
    if (hasPermission) {
      decide(PREDICATES.HAS_SUBMISSION_PERMISSIONS, true, { submissionId, permissions: requiredPerms });
      return new Set(requiredPerms);
    }
    decide(PREDICATES.HAS_SUBMISSION_PERMISSIONS, false, { submissionId });
  } catch (e) {
    decisions.push({ predicate: PREDICATES.CHECK_SUBMISSION_PERMISSION, result: false, error: e.message });
  }
  return new Set();
}

function recordDraftFileDenials(requiresRead, requiresUpdate, decide) {
  if (requiresRead) {
    decide(PREDICATES.API_USER_DRAFT_FILE_READ, false, { fileApiAccess: false });
  }
  if (requiresUpdate) {
    decide(PREDICATES.API_USER_DRAFT_FILE_DELETE, false, { fileApiAccess: false });
  }
  decide(PREDICATES.API_USER_FILE_API_ACCESS, false, { fileApiAccess: false });
}

function recordDraftFileApprovals(requiresRead, requiresUpdate, result, policy, permissions, decide, fileApiAccess) {
  if (requiresRead) {
    decide(PREDICATES.API_USER_DRAFT_FILE_READ, result, { fileApiAccess: result });
  }
  if (requiresUpdate) {
    decide(PREDICATES.API_USER_DRAFT_FILE_DELETE, result, { fileApiAccess: result });
  }
  // Also set the general file access approval
  if (result && policy.requiredPermissions) {
    for (const perm of policy.requiredPermissions) {
      permissions.add(perm);
    }
    decide(PREDICATES.API_USER_FILE_ACCESS, true, { fileApiAccess });
  }
}

module.exports = function makeEnrichRBAC({ deps }) {
  const { rbacService, authService } = deps.services || {};
  const constants = deps.constants || require('../../../forms/common/constants');
  const { Permissions } = constants;
  const enrichLogger = securityLog.enrichRBAC;

  // Comprehensive permissions that API users effectively have access to
  // Based on analysis of all routes using apiAccess middleware
  const API_USER_PERMISSIONS = [
    // Form permissions
    Permissions.FORM_READ,
    Permissions.FORM_UPDATE,
    Permissions.FORM_DELETE,

    // Design permissions
    Permissions.DESIGN_READ,
    Permissions.DESIGN_CREATE,
    Permissions.DESIGN_UPDATE,
    Permissions.DESIGN_DELETE,

    // Submission permissions
    Permissions.SUBMISSION_READ,
    Permissions.SUBMISSION_CREATE,
    Permissions.SUBMISSION_UPDATE,
    Permissions.SUBMISSION_DELETE,
    Permissions.SUBMISSION_REVIEW,

    // Document template permissions
    Permissions.DOCUMENT_TEMPLATE_READ,
    Permissions.DOCUMENT_TEMPLATE_CREATE,
    Permissions.DOCUMENT_TEMPLATE_DELETE,
  ];

  // Limited permissions for public users (FORM_SUBMITTER + conditional access)
  // Based on analysis of public user access patterns in CHEFS
  const PUBLIC_USER_PERMISSIONS = [
    // Always available (FORM_SUBMITTER)
    Permissions.FORM_READ,
    Permissions.SUBMISSION_CREATE,
    Permissions.DOCUMENT_TEMPLATE_READ,
  ];

  function grantApiUserPermissions(isApiUser, actor, permissions, decide) {
    if (!isApiUser) return;

    // Grant all comprehensive permissions to API users
    for (const perm of API_USER_PERMISSIONS) {
      permissions.add(perm);
    }

    decide(PREDICATES.API_USER_FULL_ACCESS, true, {
      permissionsGranted: API_USER_PERMISSIONS.length,
      actorType: actor?.type,
    });
  }

  function grantPublicUserPermissions(isPublicUser, publicForm, resource, policy, permissions, decide, actor) {
    if (!isPublicUser) return;

    // Grant base FORM_SUBMITTER permissions
    for (const perm of PUBLIC_USER_PERMISSIONS) {
      permissions.add(perm);
    }

    // Conditional permissions based on form being public
    if (publicForm) {
      // Public users can read submissions on public forms (but only SUBMISSION_READ)
      const requiredPerms = policy.requiredPermissions || [];
      if (requiredPerms.length === 1 && requiredPerms.includes(Permissions.SUBMISSION_READ)) {
        permissions.add(Permissions.SUBMISSION_READ);
        decide(PREDICATES.PUBLIC_USER_SUBMISSION_READ, true, {
          formId: resource.form?.id,
          condition: 'single SUBMISSION_READ permission on public form',
        });
      }
    }

    decide(PREDICATES.PUBLIC_USER_BASE_ACCESS, true, {
      permissionsGranted: PUBLIC_USER_PERMISSIONS.length,
      publicForm,
      actorType: actor?.type,
    });
  }

  function recordApiUserFileDecisions(actor, policy, resource, decide) {
    const fileApiAccess = actor?.metadata?.apiKeyMetadata?.filesApiAccess ?? actor?.metadata?.filesApiAccess;

    // Check for file creation operations (no file resource exists, indicates file creation)
    const isFileCreation = !resource?.file && policy.resourceSpec?.kind === 'formOnly';
    const isWebcomponentsRoute = policy.classification === 'webcomponents';

    if (isFileCreation) {
      if (isWebcomponentsRoute) {
        // Only webcomponents routes can create files, and only if filesApiAccess is not false
        const result = fileApiAccess !== false;
        decide(PREDICATES.API_USER_FILE_CREATE, result, { fileApiAccess: fileApiAccess !== false });
      } else {
        // Non-webcomponents routes cannot create files
        decide(PREDICATES.API_USER_FILE_CREATE, false, { reason: 'file creation only allowed on webcomponents routes' });
      }
      return;
    }

    // Check for existing file operations (read/update/delete)
    const requiresSubmissionAccess = policy.requiredPermissions?.some(
      (p) => p === Permissions.SUBMISSION_UPDATE || p === Permissions.SUBMISSION_DELETE || p === Permissions.SUBMISSION_READ
    );

    if (!requiresSubmissionAccess) return;

    // Record file access decision for existing file operations (read/update/delete)
    const result = fileApiAccess !== false;
    decide(PREDICATES.API_USER_FILE_API_ACCESS, result, { fileApiAccess: fileApiAccess !== false });
  }

  function handleDraftFileWebcomponentsRoute(fileApiAccess, policy, permissions, decide) {
    const requiresRead = policy.requiredPermissions?.includes(Permissions.SUBMISSION_READ);
    const requiresUpdate = policy.requiredPermissions?.includes(Permissions.SUBMISSION_UPDATE);

    if (fileApiAccess === false) {
      recordDraftFileDenials(requiresRead, requiresUpdate, decide);
      return;
    }

    const result = fileApiAccess !== false;
    recordDraftFileApprovals(requiresRead, requiresUpdate, result, policy, permissions, decide, fileApiAccess);
  }

  function handleDraftFileNonWebcomponentsRoute(policy, decide) {
    const requiresRead = policy.requiredPermissions?.includes(Permissions.SUBMISSION_READ);
    const requiresUpdate = policy.requiredPermissions?.includes(Permissions.SUBMISSION_UPDATE);
    const reason = 'draft file access only allowed on webcomponents routes';

    if (requiresRead) {
      decide(PREDICATES.API_USER_DRAFT_FILE_READ, false, { reason });
    }
    if (requiresUpdate) {
      decide(PREDICATES.API_USER_DRAFT_FILE_DELETE, false, { reason });
    }
    decide(PREDICATES.API_USER_FILE_API_ACCESS, false, { reason });
  }

  function handleSubmittedFileAccess(fileApiAccess, policy, permissions, decide) {
    if (fileApiAccess === false) {
      // Explicitly denied file access - record decision (let downstream middleware handle error)
      const requiresSubmissionAccess = policy.requiredPermissions?.some(
        (p) => p === Permissions.SUBMISSION_UPDATE || p === Permissions.SUBMISSION_DELETE || p === Permissions.SUBMISSION_READ
      );
      if (requiresSubmissionAccess) {
        decide(PREDICATES.API_USER_FILE_API_ACCESS, false, { fileApiAccess: false });
      }
      return;
    }

    // File access allowed (default or explicit true) - grant required permissions
    if (policy.requiredPermissions) {
      for (const perm of policy.requiredPermissions) {
        permissions.add(perm);
      }
      decide(PREDICATES.API_USER_FILE_ACCESS, true, { fileApiAccess });
    }
  }

  function grantApiUserFilePermissions(isApiUser, resource, actor, policy, permissions, decide) {
    if (!isApiUser || !resource?.file) return;

    const fileApiAccess = actor?.metadata?.apiKeyMetadata?.filesApiAccess ?? actor?.metadata?.filesApiAccess;
    const isDraftFile = !resource.file.formSubmissionId;
    const isWebcomponentsRoute = policy.classification === 'webcomponents';

    // Handle draft files - only webcomponents routes can access draft files
    if (isDraftFile) {
      if (isWebcomponentsRoute) {
        handleDraftFileWebcomponentsRoute(fileApiAccess, policy, permissions, decide);
      } else {
        handleDraftFileNonWebcomponentsRoute(policy, decide);
      }
      return;
    }

    // For submitted files, use existing logic
    handleSubmittedFileAccess(fileApiAccess, policy, permissions, decide);
  }

  function grantPublicUserFilePermissions(isPublicUser, publicForm, resource, policy, permissions, decide) {
    if (!isPublicUser || !resource?.file) return;

    // Check if file is in draft state (not yet submitted)
    const isDraftFile = !resource.file.formSubmissionId;

    if (isDraftFile && publicForm) {
      // Public users can upload and delete draft files on public forms
      const requiredPerms = policy.requiredPermissions || [];
      if (requiredPerms.includes(Permissions.SUBMISSION_CREATE) || requiredPerms.includes(Permissions.SUBMISSION_UPDATE)) {
        for (const perm of requiredPerms) {
          permissions.add(perm);
        }
        decide(PREDICATES.PUBLIC_USER_DRAFT_FILE_ACCESS, true, {
          formId: resource.form?.id,
          condition: 'draft file on public form',
        });
      }
    } else if (!isDraftFile) {
      // Submitted files - record denial decision (let downstream middleware handle error)
      decide(PREDICATES.PUBLIC_USER_SUBMITTED_FILE_ACCESS, false, {
        formId: resource.form?.id,
        reason: 'public users cannot access submitted files',
      });
      // Don't throw error - let filePermissions middleware handle it
    }
  }

  return async function enrichRBAC({ policy, who, resource, currentUser, apiUser }) {
    const decisions = [];
    const permissions = new Set();
    const roles = new Set();
    const actorId = who?.actor?.id || who?.actor;

    function decide(name, result, meta) {
      const decision = { predicate: name, result: !!result };
      if (meta) {
        Object.assign(decision, meta);
      }
      decisions.push(decision);
      return !!result;
    }

    // Phase 1: Understand context
    const actor = who?.actor;
    const isApiUser = apiUser === true;
    const isPublicUser = actor?.type === 'public';
    const publicForm = resource?.publicForm || false;

    // Phase 2: Handle special cases (API users and Public users) - SKIP database calls
    if (isApiUser) {
      // API users get comprehensive permissions, skip database calls
      grantApiUserPermissions(isApiUser, actor, permissions, decide);
      grantApiUserFilePermissions(isApiUser, resource, actor, policy, permissions, decide);

      // Record file access decisions for all API users (file creation and existing files)
      recordApiUserFileDecisions(actor, policy, resource, decide);

      decide(PREDICATES.API_USER_DATABASE_SKIP, true, { reason: 'API users bypass database permission checks' });
    } else if (isPublicUser) {
      // Public users get limited permissions based on form being public
      grantPublicUserPermissions(isPublicUser, publicForm, resource, policy, permissions, decide, actor);
      grantPublicUserFilePermissions(isPublicUser, publicForm, resource, policy, permissions, decide);
      decide(PREDICATES.PUBLIC_USER_DATABASE_SKIP, true, { reason: 'Public users bypass database permission checks' });
    } else {
      // Phase 3: Load permissions from database for authenticated users
      const dbRoles = await loadRolesFromDatabase(resource, actor, rbacService, decisions);
      for (const role of dbRoles) roles.add(role);

      const dbFormPerms = await loadFormPermissionsFromDatabase(resource, actor, authService, currentUser, decisions, decide);
      for (const perm of dbFormPerms) permissions.add(perm);

      const dbSubmissionPerms = await loadSubmissionPermissionsFromDatabase(resource, actor, authService, currentUser, policy, decisions, decide);
      for (const perm of dbSubmissionPerms) permissions.add(perm);
    }

    // Add isAdmin from actor (from JWT token)
    if (actor?.isAdmin) roles.add('admin');

    // Phase 4: Return the enriched context (validation happens in orchestrator or middleware)
    const required = policy.requiredPermissions || [];

    // Log RBAC enrichment summary
    enrichLogger.info({
      event: 'rbac_enrichment_complete',
      actor: actorId,
      actorType: actor?.type || 'unknown',
      resourceKind: policy.resourceSpec?.kind || 'none',
      permissionsGranted: permissions.size,
      rolesGranted: roles.size,
      decisionsCount: decisions.length,
      isApiUser,
      isPublicUser,
      publicForm,
    });

    return {
      actorId,
      roles: Array.from(roles),
      permissions: Array.from(permissions),
      decisions,
      required, // Expose required for validation
    };
  };
};
