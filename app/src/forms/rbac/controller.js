const emailService = require('../email/emailService');
const formService = require('../submission/service');
const service = require('./service');
const tenantService = require('../../components/tenantService');
const userService = require('../user/service');
const { FormTenant, FormSubmissionUser } = require('../common/models');

const BCEID_IDP_CODES = new Set(['bceid-basic', 'bceid-business']);

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

  getMigrationPreview: async (req, res, next) => {
    try {
      const { formId } = req.params;

      const existing = await FormTenant.query().where({ formId }).first();
      if (existing) {
        return res.status(400).json({ detail: 'Form is already migrated to a tenant.' });
      }

      const [eligibleTenants, teamMembers, submissionStatsResult, shareUsersResult] = await Promise.all([
        tenantService.getEligibleTenantsForMigration(req),
        service.getFormUsers({ formId }),
        FormSubmissionUser.knex().raw(
          `SELECT
             COUNT(DISTINCT fs.id)                                    AS total,
             COUNT(DISTINCT fs.id) FILTER (WHERE fs.draft = true)    AS drafts
           FROM form_version fv
           JOIN form_submission fs ON fs."formVersionId" = fv.id
           WHERE fv."formId" = ? AND fs.deleted = false`,
          [formId]
        ),
        FormSubmissionUser.knex().raw(
          `SELECT COUNT(DISTINCT fsu."formSubmissionId") AS count
           FROM form_submission_user fsu
           JOIN form_submission fs ON fs.id = fsu."formSubmissionId"
           JOIN form_version fv ON fv.id = fs."formVersionId"
           WHERE fv."formId" = ?`,
          [formId]
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
            roleSet: new Set(),
          });
        }
        const entry = userMap.get(m.email);
        if (Array.isArray(m.roles)) {
          for (const r of m.roles) entry.roleSet.add(r);
        }
      }

      const stats = submissionStatsResult.rows[0] || {};

      res.status(200).json({
        eligibleTenants,
        impact: {
          team: Array.from(userMap.values()).map(({ roleSet, ...rest }) => ({ ...rest, roles: [...roleSet] })),
          submissions: {
            total: parseInt(stats.total || '0', 10),
            drafts: parseInt(stats.drafts || '0', 10),
            withShareUsers: parseInt(shareUsersResult.rows[0]?.count || '0', 10),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  migrateForm: async (req, res, next) => {
    try {
      const { formId } = req.params;
      const { tenantId } = req.body;

      if (!tenantId) {
        return res.status(400).json({ detail: 'tenantId is required.' });
      }

      await tenantService.migrateFormToTenant(req, formId, tenantId);
      res.status(200).json({ message: 'Form migrated successfully.' });
    } catch (error) {
      if (error.code === 'ALREADY_MIGRATED') {
        return res.status(400).json({ detail: 'Form is already migrated to a tenant.' });
      }
      if (error.code === 'FORM_ADMIN_GROUP_REQUIRED') {
        return res.status(400).json({ detail: error.message, code: error.code });
      }
      const cstarStatus = error?.response?.status;
      if (cstarStatus === 401 || cstarStatus === 403) {
        return res.status(401).json({ detail: 'Your session has expired. Please refresh the page and try again.' });
      }
      next(error);
    }
  },
};
