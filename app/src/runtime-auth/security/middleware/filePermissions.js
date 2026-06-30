/**
 * File Permission Middleware for runtime-auth
 * Exports hasFileCreate and hasFilePermissions functions that leverage RBAC
 *
 * Usage:
 *   app.post('/files', buildSecurity(deps), hasFileCreate, handler);
 *   app.get('/files/:fileId', buildSecurity(deps), hasFilePermissions([Permissions.SUBMISSION_READ]), handler);
 */
const Problem = require('api-problem');
const { HTTP_STATUS } = require('../httpStatus');
const ERRORS = require('../errorMessages');
const PREDICATES = require('../predicates');
const securityLog = require('../logger');

const filePermissionsLogger = securityLog.filePermissions;

function handleApiUserDenial(decision, reason, next) {
  filePermissionsLogger.warn({
    event: 'file_access_denied',
    reason,
    decision: decision.predicate,
    fileState: 'draft',
  });
  return next(new Problem(HTTP_STATUS.FORBIDDEN, { detail: ERRORS.FORBIDDEN }));
}

function handleApiUserApproval(decision, reason, next) {
  filePermissionsLogger.info({
    event: 'file_access_granted',
    reason,
    decision: decision.predicate,
    fileState: 'draft',
  });
  return next();
}

function checkOperationSpecificDenial(decisions, isReadOperation, isDeleteOperation, next) {
  if (isReadOperation) {
    const apiUserReadDenied = decisions.find((d) => d.predicate === PREDICATES.API_USER_DRAFT_FILE_READ && d.result === false);
    if (apiUserReadDenied) {
      return handleApiUserDenial(apiUserReadDenied, 'api_user_draft_file_read_denied', next);
    }
  }

  if (isDeleteOperation) {
    const apiUserDeleteDenied = decisions.find((d) => d.predicate === PREDICATES.API_USER_DRAFT_FILE_DELETE && d.result === false);
    if (apiUserDeleteDenied) {
      return handleApiUserDenial(apiUserDeleteDenied, 'api_user_draft_file_delete_denied', next);
    }
  }

  return null;
}

function checkOperationSpecificApproval(decisions, isReadOperation, isDeleteOperation, next) {
  if (isReadOperation) {
    const apiUserReadApproved = decisions.find((d) => d.predicate === PREDICATES.API_USER_DRAFT_FILE_READ && d.result === true);
    if (apiUserReadApproved) {
      return handleApiUserApproval(apiUserReadApproved, 'api_user_draft_file_read_approved', next);
    }
  }

  if (isDeleteOperation) {
    const apiUserDeleteApproved = decisions.find((d) => d.predicate === PREDICATES.API_USER_DRAFT_FILE_DELETE && d.result === true);
    if (apiUserDeleteApproved) {
      return handleApiUserApproval(apiUserDeleteApproved, 'api_user_draft_file_delete_approved', next);
    }
  }

  return null;
}

function checkDraftFileAccess(file, resource, decisions, req, next) {
  // Determine operation type from HTTP method
  const isReadOperation = req.method === 'GET';
  const isDeleteOperation = req.method === 'DELETE';

  // Check for explicit denials first (API users with filesApiAccess: false)
  const denialResult = checkOperationSpecificDenial(decisions, isReadOperation, isDeleteOperation, next);
  if (denialResult) {
    return denialResult;
  }

  // Check for general API user file access denial
  const apiUserFileAccessDenied = decisions.find((d) => d.predicate === PREDICATES.API_USER_FILE_API_ACCESS && d.result === false);
  if (apiUserFileAccessDenied) {
    return handleApiUserDenial(apiUserFileAccessDenied, 'api_user_file_api_access_denied', next);
  }

  // Check for general API user file access approval
  const apiUserApproved = decisions.find((d) => d.predicate === PREDICATES.API_USER_FILE_ACCESS && d.result === true);
  if (apiUserApproved) {
    return handleApiUserApproval(apiUserApproved, 'api_user_file_access_approved', next);
  }

  // Check for operation-specific approvals
  const approvalResult = checkOperationSpecificApproval(decisions, isReadOperation, isDeleteOperation, next);
  if (approvalResult) {
    return approvalResult;
  }

  // current user is the uploader and the file is a draft, allow access
  const isUploader = file.createdBy && String(file.createdBy) === String(req.currentUser?.id);
  if (isUploader) {
    filePermissionsLogger.info({
      event: 'file_access_granted',
      reason: 'draft_file_uploader_access',
      fileState: 'draft',
    });
    return next();
  }

  // form is public, allow access
  const isPublicForm = resource?.publicForm;
  if (isPublicForm) {
    filePermissionsLogger.info({
      event: 'file_access_granted',
      reason: 'public_form_access',
      fileState: 'draft',
    });
    return next();
  }

  filePermissionsLogger.warn({
    event: 'file_access_denied',
    reason: 'unauthorized_file_uploader',
    fileState: 'draft',
  });
  return next(new Problem(HTTP_STATUS.FORBIDDEN, { detail: ERRORS.UNAUTHORIZED_FILE_UPLOADER }));
}

function checkSubmittedFileAccess(decisions, requiredPermissions, permissions, next) {
  // Check for positive approvals first
  const apiUserApproved = decisions.find((d) => d.predicate === PREDICATES.API_USER_FILE_ACCESS && d.result === true);
  if (apiUserApproved) {
    filePermissionsLogger.info({
      event: 'file_access_granted',
      reason: 'api_user_file_access_approved',
      decision: apiUserApproved.predicate,
      fileState: 'submitted',
    });
    return next();
  }

  // Check for explicit denials (only when decisions exist)
  const publicUserDenied = decisions.find((d) => d.predicate === PREDICATES.PUBLIC_USER_SUBMITTED_FILE_ACCESS && d.result === false);
  const apiUserDenied = decisions.find((d) => d.predicate === PREDICATES.API_USER_FILE_API_ACCESS && d.result === false);

  if (publicUserDenied) {
    filePermissionsLogger.warn({
      event: 'file_access_denied',
      reason: 'public_user_submitted_file_access_denied',
      decision: publicUserDenied.predicate,
      fileState: 'submitted',
    });
    return next(new Problem(HTTP_STATUS.FORBIDDEN, { detail: ERRORS.UNAUTHORIZED_FILE_ACCESS }));
  }

  if (apiUserDenied) {
    filePermissionsLogger.warn({
      event: 'file_access_denied',
      reason: 'api_user_file_api_access_denied',
      decision: apiUserDenied.predicate,
      metadata: apiUserDenied,
      fileState: 'submitted',
    });
    return next(new Problem(HTTP_STATUS.FORBIDDEN, { detail: ERRORS.FORBIDDEN }));
  }

  // Standard permission check for regular users (OIDC users fall through here)
  const hasAllPermissions = requiredPermissions.every((perm) => permissions.includes(perm));
  if (!hasAllPermissions) {
    const missing = requiredPermissions.filter((perm) => !permissions.includes(perm));
    filePermissionsLogger.warn({
      event: 'file_access_denied',
      reason: 'missing_permissions',
      missing,
      required: requiredPermissions,
      granted: permissions,
      fileState: 'submitted',
    });
    return next(
      new Problem(HTTP_STATUS.FORBIDDEN, {
        detail: ERRORS.MISSING_FILE_PERMISSIONS,
        missing,
        required: requiredPermissions,
        granted: permissions,
      })
    );
  }

  filePermissionsLogger.info({
    event: 'file_access_granted',
    reason: 'standard_permission_check_passed',
    fileState: 'submitted',
  });
  return next();
}

/**
 * Middleware for file upload operations (POST /files)
 * Leverages RBAC decisions for API users and standard logic for others
 */
function hasFileCreate(req, res, next) {
  const context = req.securityContext;
  if (!context?.rbac) {
    filePermissionsLogger.error({
      event: 'file_create_check_error',
      error: 'security_context_missing',
    });
    return next(new Problem(HTTP_STATUS.INTERNAL_SERVER_ERROR, { detail: ERRORS.SECURITY_CONTEXT_MISSING }));
  }

  const resource = context.resource;
  const decisions = context.rbac.decisions || [];

  // Check for API user file create decisions
  const apiUserCreateDenied = decisions.find((d) => d.predicate === PREDICATES.API_USER_FILE_CREATE && d.result === false);
  if (apiUserCreateDenied) {
    filePermissionsLogger.warn({
      event: 'file_create_denied',
      reason: 'api_user_file_create_denied',
      decision: apiUserCreateDenied.predicate,
    });
    return next(new Problem(HTTP_STATUS.FORBIDDEN, { detail: 'File upload denied for this API key' }));
  }

  // For API users with file access, always allow (regardless of form being public)
  const apiUserCreateApproved = decisions.find((d) => d.predicate === PREDICATES.API_USER_FILE_CREATE && d.result === true);
  if (apiUserCreateApproved) {
    filePermissionsLogger.info({
      event: 'file_create_granted',
      reason: 'api_user_file_create_approved',
      decision: apiUserCreateApproved.predicate,
    });
    return next();
  }

  // For authenticated users (OIDC), always allow (mimics current hasFileCreate behavior)
  const actor = context.who?.actor;
  if (actor?.type === 'user') {
    filePermissionsLogger.info({
      event: 'file_create_granted',
      reason: 'oidc_user_file_create_granted',
    });
    return next();
  }

  // Check if form is public (from security context)
  const isPublicForm = resource?.publicForm;
  if (!isPublicForm) {
    filePermissionsLogger.warn({
      event: 'file_create_denied',
      reason: 'authentication_required_for_file_uploads',
    });
    return next(new Problem(HTTP_STATUS.FORBIDDEN, { detail: 'Authentication required for file uploads on this form' }));
  }

  filePermissionsLogger.info({
    event: 'file_create_granted',
    reason: 'public_form_access',
  });
  return next();
}

/**
 * Middleware for individual file access operations (GET/DELETE /files/:fileId)
 * Leverages RBAC decisions and file-specific permission logic
 */
function hasFilePermissions(requiredPermissions) {
  return (req, res, next) => {
    const context = req.securityContext;
    if (!context?.rbac) {
      filePermissionsLogger.error({
        event: 'file_permission_check_error',
        error: 'security_context_missing',
      });
      return next(new Problem(HTTP_STATUS.INTERNAL_SERVER_ERROR, { detail: ERRORS.SECURITY_CONTEXT_MISSING }));
    }

    const { permissions } = context.rbac;
    const resource = context.resource;
    const file = resource?.file;
    const decisions = context.rbac.decisions || [];
    const actor = context.who?.actor;

    let fileState = 'not_found';
    if (file) {
      if (file.formSubmissionId) {
        fileState = 'submitted';
      } else {
        fileState = 'draft';
      }
    }

    filePermissionsLogger.info({
      event: 'file_permission_check_start',
      fileId: file?.id,
      fileState,
      requiredPermissions,
      actor: actor?.id || 'unknown',
    });

    if (file && !file.formSubmissionId) {
      filePermissionsLogger.debug({
        event: 'draft_file_check',
        fileId: file.id,
        createdBy: file.createdBy,
      });
      return checkDraftFileAccess(file, resource, decisions, req, next);
    }

    if (file && file.formSubmissionId) {
      filePermissionsLogger.debug({
        event: 'submitted_file_check',
        fileId: file.id,
        submissionId: file.formSubmissionId,
      });
      return checkSubmittedFileAccess(decisions, requiredPermissions, permissions, next);
    }

    filePermissionsLogger.warn({
      event: 'file_permission_check_file_not_found',
      fileId: req.params?.fileId,
    });
    return next(new Problem(HTTP_STATUS.NOT_FOUND, { detail: ERRORS.FILE_NOT_FOUND }));
  };
}

module.exports = {
  hasFileCreate,
  hasFilePermissions,
};
