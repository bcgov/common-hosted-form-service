const emailService = require('../email/emailService');
const formService = require('../submission/service');
const service = require('./service');
const tenantService = require('../../components/tenantService');
const userService = require('../user/service');
const uuid = require('uuid');
const { Form, FormMigrationLog, FormTenant, FormSubmissionUser } = require('../common/models');
const { HUMAN_USER_SQL_PREDICATE, humanUserJoin } = require('../common/systemUsers');
const { Permissions } = require('../common/constants');

// TenantService validates its own arguments by throwing TypeError. Those are caller
// mistakes (a malformed id in the request), not server faults, so answer 400 — and never
// pass the raw `TenantService: ...` text to the user.
const _handleMigrationError = (error, res, next) => {
  if (error instanceof TypeError && String(error.message).startsWith('TenantService:')) {
    return res.status(400).json({ detail: 'The request contained an invalid tenant or form identifier.' });
  }
  return next(error);
};

const BCEID_IDP_CODES = new Set(['bceid-basic', 'bceid-business']);
const BCEID_BASIC_IDP_CODE = 'bceid-basic';

// Shared mapping for a raw CSTAR user object → RBAC response shape.
async function _mapCstarUser(user) {
  const ssoUser = user?.ssoUser || {};
  const idpType = ssoUser?.idpType || null;
  const identityProviders = idpType ? [idpType] : [];
  let resolvedUserId = user?.id || null;

  if (ssoUser?.ssoUserId) {
    const dbUser = await userService.readByKeycloakId(ssoUser.ssoUserId);
    if (dbUser?.id) resolvedUserId = dbUser.id;
  }

  return {
    userId: resolvedUserId,
    idpUserId: ssoUser?.ssoUserId || null,
    username: ssoUser?.userName || null,
    fullName: ssoUser?.displayName || null,
    firstName: ssoUser?.firstName || null,
    lastName: ssoUser?.lastName || null,
    email: ssoUser?.email || null,
    formId: null,
    formName: null,
    labels: [],
    user_idpCode: idpType,
    identityProviders,
    form_login_required: identityProviders,
    idps: identityProviders,
    active: user?.isDeleted === false,
    formVersionId: null,
    version: null,
    roles: [],
    permissions: [],
    published: null,
    versionUpdatedAt: null,
    formDescription: null,
  };
}

module.exports = {
  list: async (req, res, next) => {
    try {
      const response = await service.list();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const response = await service.create(req.body);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  read: async (req, res, next) => {
    try {
      const response = await service.read(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const response = await service.update(req.params.id, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const response = await service.delete(req.params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUser: async (req, res, next) => {
    try {
      const response = await service.getCurrentUser(req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUserForms: async (req, res, next) => {
    try {
      const response = await service.getCurrentUserForms(req.currentUser, req.query, req.headers);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUserSubmissions: async (req, res, next) => {
    try {
      const response = await service.getCurrentUserSubmissions(req.currentUser, req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getFormUsers: async (req, res, next) => {
    try {
      let response;
      if (req.currentUser && req.currentUser.tenantId) {
        // Tenant context present (admin/manage view): fetch all users for this tenant from CSTAR.
        const tenantUsers = await tenantService.getTenantUsers(req);
        response = await Promise.all(tenantUsers.map(_mapCstarUser));
      } else if (req.query.formId) {
        // No tenant context (submit view): check whether the form is group-restricted and, if so,
        // fetch users using the form's own tenant rather than the current user's tenant.
        const formTenantUsers = await tenantService.getUsersForForm(req, req.query.formId);
        if (formTenantUsers) {
          response = await Promise.all(formTenantUsers.map(_mapCstarUser));
        } else {
          response = await service.getFormUsers(req.query);
        }
      } else {
        // Personal/classic CHEFS: look up form team members from local DB.
        response = await service.getFormUsers(req.query);
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setFormUsers: async (req, res, next) => {
    try {
      const response = await service.setFormUsers(req.query.formId, req.query.userId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  removeMultiUsers: async (req, res, next) => {
    try {
      const response = await service.removeMultiUsers(req.query.formId, req.body);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getSubmissionUsers: async (req, res, next) => {
    try {
      const response = await service.getSubmissionUsers(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setSubmissionUserPermissions: async (req, res, next) => {
    try {
      const submission = await formService.read(req.query.formSubmissionId, req.currentUser);
      const response = await service.modifySubmissionUser(req.query.formSubmissionId, req.query.userId, req.body, req.currentUser);
      if (req.body && Array.isArray(req.body.permissions) && req.query.selectedUserEmail) {
        // Check if we are adding or removing a user from the draft invite list. empty permissions signifies that we are removing permissions from a user.
        if (req.body.permissions.length) {
          emailService.submissionAssigned(submission.form.id, response[0], req.query.selectedUserEmail, req.headers.referer);
        } else {
          emailService.submissionUnassigned(submission.form.id, response[0], req.query.selectedUserEmail, req.headers.referer);
        }
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getUserForms: async (req, res, next) => {
    try {
      const response = await service.getUserForms(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  setUserForms: async (req, res, next) => {
    try {
      const response = await service.setUserForms(req.query.userId, req.query.formId, req.body, req.currentUser);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  getIdentityProviders: async (req, res, next) => {
    try {
      const response = await service.getIdentityProviders(req.query);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  isUserPartOfFormTeams: async (req, res, next) => {
    let result = true;
    try {
      const { formId, email } = req.query;

      // For tenanted forms with group assignments, validate against CSTAR groups.
      // Returns null when the form has no groups → fall through to CHEFS team check.
      if (formId && email) {
        const groupCheck = await tenantService.isUserInFormGroups(req, formId, email);
        if (groupCheck !== null) {
          return res.status(200).json(groupCheck);
        }
      }

      // Personal / classic CHEFS: check whether the user is a form team member.
      const response = await service.getFormUsers(req.query);
      if (Array.isArray(response) && response.length === 0) {
        result = false;
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
  getCurrentUserTenants: async (req, res, next) => {
    try {
      if (!req.currentUser || !req.currentUser.idpUserId) {
        return res.status(200).json([]);
      }
      const tenants = await tenantService.getCurrentUserTenants(req);
      // If upstream tenant service was degraded, inform clients via header
      if (req._tenantServiceDegraded) {
        res.set('X-Tenant-Service-Status', 'degraded');
      }
      res.status(200).json(tenants);
    } catch (error) {
      next(error);
    }
  },
  getGroupsForCurrentTenant: async (req, res, next) => {
    try {
      const groups = await tenantService.getGroupsForCurrentTenant(req);
      res.status(200).json(groups);
    } catch (error) {
      next(error);
    }
  },
  assignGroupsToForm: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const { groupIds } = req.body;

      if (!groupIds || !Array.isArray(groupIds)) {
        return res.status(400).json({ error: 'groupIds must be an array' });
      }

      const result = await tenantService.assignGroupsToForm(req, formId, groupIds);
      res.status(200).json({ success: result });
    } catch (error) {
      if (error.message?.includes('at least one assigned group must have form_admin role')) {
        return res.status(422).json({ detail: error.message, code: 'FORM_ADMIN_GROUP_REQUIRED' });
      }
      if (error.message?.includes('invalid groupIds')) {
        return res.status(422).json({ detail: error.message, code: 'INVALID_GROUP_IDS' });
      }
      if (error.message?.includes('insufficient permissions')) {
        return res.status(403).json({ detail: error.message, code: 'INSUFFICIENT_PERMISSIONS' });
      }
      next(error);
    }
  },
  getFormGroups: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const groups = await tenantService.getFormGroups(req, formId);
      res.status(200).json(groups);
    } catch (error) {
      next(error);
    }
  },

  getMigrationTenantGroups: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const { tenantId } = req.query;
      if (!tenantId) return res.status(400).json({ detail: 'tenantId is required.' });
      if (!uuid.validate(tenantId)) return res.status(400).json({ detail: 'tenantId is not a valid identifier.' });

      const existing = await FormTenant.query().where({ formId }).first();
      if (existing) return res.status(400).json({ detail: 'Form is already migrated to a tenant.' });

      // Only tenants the user could actually migrate into may be inspected. Without this
      // the endpoint listed the groups of any tenant whose id was guessed or pasted in.
      // The check lives in the service, which already reads the user's groups for this
      // tenant, so it costs no extra CSTAR calls.
      const result = await tenantService.getMigrationTenantGroups(req, formId, tenantId);
      res.status(200).json(result);
    } catch (error) {
      if (error.code === 'TENANT_NOT_ELIGIBLE') {
        return res.status(403).json({ detail: error.message, code: error.code });
      }
      return _handleMigrationError(error, res, next);
    }
  },

  getMigrationPreview: async (req, res, next) => {
    try {
      const { formId } = req.params;

      // An already-migrated form is a valid state to look at, not an error. Returning 400
      // here meant revisiting the page — including browser Back after migrating — rendered
      // an error instead of telling the user the migration had already happened.
      const existing = await FormTenant.query().where({ formId }).first();
      if (existing) {
        const [migratedForm, migration] = await Promise.all([
          Form.query().findById(formId).select('id', 'name'),
          FormMigrationLog.query().where({ formId }).orderBy('createdAt', 'desc').first(),
        ]);
        return res.status(200).json({
          alreadyMigrated: true,
          formName: migratedForm?.name || null,
          tenantId: existing.tenantId,
          migratedAt: migration?.createdAt || null,
          migratedBy: migration?.createdBy || null,
          eligibleTenants: [],
          impact: null,
        });
      }

      // An explicit Refresh must reflect group/tenant changes made in CSTAR moments ago,
      // so it bypasses the short-TTL tenant cache rather than serving a stale list.
      const bypassCache = req.query?.refresh === 'true';

      const [form, eligibleTenants, teamMembers, submissionStatsResult, shareUsersResult] = await Promise.all([
        Form.query().findById(formId).select('id', 'name'),
        tenantService.getEligibleTenantsForMigration(req, { bypassCache }),
        service.getFormUsers({ formId }),
        FormSubmissionUser.knex().raw(
          `SELECT
             COUNT(DISTINCT fs.id) FILTER (WHERE fs.draft = false)   AS total,
             COUNT(DISTINCT fs.id) FILTER (WHERE fs.draft = true)    AS drafts
           FROM form_version fv
           JOIN form_submission fs ON fs."formVersionId" = fv.id
           WHERE fv."formId" = ? AND fs.deleted = false`,
          [formId]
        ),
        // Distinct PEOPLE the form's submissions are shared WITH — not the number of
        // submissions carrying share rows, not service accounts, and not the submitters
        // themselves. Every submitter gets form_submission_user rows for their own
        // submission, so without excluding them a form with no sharing at all reports
        // its owner as a shared user.
        //
        // submission_create marks the creator: form/service.js grants it only to the
        // submitter ("We know this is the submission creator when we see the
        // SUBMISSION_CREATE permission"), while rbac/service.js writes shares with the
        // permissions the sharer chose. Excluded per submission, so someone who created
        // one submission and was shared on another is still counted for the latter.
        FormSubmissionUser.knex().raw(
          `SELECT hu.id, hu.email, hu."fullName", hu."idpCode"
           FROM form_submission_user fsu
           JOIN form_submission fs ON fs.id = fsu."formSubmissionId"
           JOIN form_version fv ON fv.id = fs."formVersionId"
           ${humanUserJoin('fsu."userId"')}
           WHERE fv."formId" = ? AND fs.deleted = false AND ${HUMAN_USER_SQL_PREDICATE}
             AND NOT EXISTS (
               SELECT 1 FROM form_submission_user creator
               WHERE creator."formSubmissionId" = fsu."formSubmissionId"
                 AND creator."userId" = fsu."userId"
                 AND creator.permission = ?
             )
           GROUP BY hu.id, hu.email, hu."fullName", hu."idpCode"
           ORDER BY lower(coalesce(hu."fullName", hu.email))`,
          [formId, Permissions.SUBMISSION_CREATE]
        ),
      ]);

      // user_form_roles_vw UNIONs every user with roles={} for forms they have no
      // explicit entry on — filter those out so only real team members appear.
      const explicitTeamMembers = teamMembers.filter((m) => Array.isArray(m.roles) && m.roles.length > 0);

      // Build a unique-user map; use a Set per entry to deduplicate roles in O(1).
      const userMap = new Map();
      for (const m of explicitTeamMembers) {
        if (!userMap.has(m.email)) {
          userMap.set(m.email, {
            email: m.email,
            fullName: m.fullName,
            idpCode: m.user_idpCode || null,
            isBceid: BCEID_IDP_CODES.has(m.user_idpCode),
            isBceidBasic: m.user_idpCode === BCEID_BASIC_IDP_CODE,
            roleSet: new Set(),
          });
        }
        const entry = userMap.get(m.email);
        if (Array.isArray(m.roles)) {
          for (const r of m.roles) entry.roleSet.add(r);
        }
      }

      const stats = submissionStatsResult.rows[0] || {};
      const sharedUsers = (shareUsersResult.rows || []).map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        idpCode: u.idpCode,
      }));

      res.status(200).json({
        formName: form?.name || null,
        eligibleTenants,
        impact: {
          team: Array.from(userMap.values()).map(({ roleSet, ...rest }) => ({ ...rest, roles: [...roleSet] })),
          submissions: {
            total: parseInt(stats.total || '0', 10),
            drafts: parseInt(stats.drafts || '0', 10),
            // Count is derived from the list so the figure and the names can never disagree.
            withShareUsers: sharedUsers.length,
          },
          // The people behind the count, so the page can show who rather than how many.
          sharedUsers,
        },
      });
    } catch (error) {
      return _handleMigrationError(error, res, next);
    }
  },

  migrateForm: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const { tenantId, groupIds } = req.body;

      if (!tenantId) return res.status(400).json({ detail: 'tenantId is required.' });
      if (!uuid.validate(tenantId)) return res.status(400).json({ detail: 'tenantId is not a valid identifier.' });
      if (groupIds !== undefined && !Array.isArray(groupIds)) {
        return res.status(400).json({ detail: 'groupIds must be an array.' });
      }
      // An empty array is a request to assign nothing, which is not the same as omitting
      // the field. Silently substituting every form_admin group assigned access the
      // caller never asked for, and contradicted the UI's own "pick a group" rule.
      if (Array.isArray(groupIds) && groupIds.length === 0) {
        return res.status(400).json({ detail: 'At least one group must be assigned.', code: 'INVALID_GROUP' });
      }

      await tenantService.migrateFormToTenant(req, formId, tenantId, groupIds || null);
      res.status(200).json({ message: 'Form migrated successfully.' });
    } catch (error) {
      if (error.code === 'ALREADY_MIGRATED') return res.status(400).json({ detail: 'Form is already migrated to a tenant.', code: error.code });
      if (error.code === 'INVALID_GROUP') return res.status(400).json({ detail: error.message, code: error.code });
      if (error.code === 'FORM_ADMIN_GROUP_REQUIRED') return res.status(400).json({ detail: error.message, code: error.code });
      if (error.code === 'ECONNABORTED')
        return res.status(503).json({ detail: 'The tenant service is taking too long to respond. Please try again in a moment.', code: 'CSTAR_TIMEOUT' });
      const cstarStatus = error?.response?.status;
      const isCstarNetworkError = ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code) || [500, 502, 503, 504].includes(cstarStatus);
      if (isCstarNetworkError) return res.status(503).json({ detail: 'The tenant service is currently unavailable. Please try again in a moment.', code: 'CSTAR_UNAVAILABLE' });
      if (cstarStatus === 401) return res.status(401).json({ detail: 'Your session has expired. Please refresh the page and try again.', code: 'SESSION_EXPIRED' });
      if (cstarStatus === 403) return res.status(403).json({ detail: 'Insufficient permissions in CSTAR.', code: 'CSTAR_FORBIDDEN' });
      return _handleMigrationError(error, res, next);
    }
  },
};
