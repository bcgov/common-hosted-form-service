module.exports = Object.freeze({
  Permissions: {
    FORM_READ: 'form_read',
    FORM_UPDATE: 'form_update',
    FORM_DELETE: 'form_delete',
    SUBMISSION_CREATE: 'submission_create',
    SUBMISSION_READ: 'submission_read',
    SUBMISSION_UPDATE: 'submission_update',
    SUBMISSION_DELETE: 'submission_delete',
    DESIGN_CREATE: 'design_create',
    DESIGN_READ: 'design_read',
    DESIGN_UPDATE: 'design_update',
    DESIGN_DELETE: 'design_delete',
    TEAM_READ: 'team_read',
    TEAM_UPDATE: 'team_update',
    FORM_SUBMITTER: ['form_read', 'submission_create']
  },
  Roles: {
    OWNER: 'owner',
    TEAM_MANAGER: 'team_manager',
    FORM_DESIGNER: 'form_designer',
    SUBMISSION_REVIEWER: 'submission_reviewer',
    FORM_SUBMITTER: 'form_submitter'
  },
  Regex: {
    CONFIRMATION_ID: '^[0-9A-Fa-f]{8}$',
    UUID: '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$',
    EMAIL: '^(([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
  },
  Statuses: {
    SUBMITTED: 'SUBMITTED',
    ASSIGNED: 'ASSIGNED',
    COMPLETED: 'COMPLETED',
  },
  StorageTypes: {
    UPLOADS: 'uploads',
    LOCAL_STORAGE: 'localStorage',
    OBJECT_STORAGE: 'objectStorage',
    LOCAL_STORES: ['uploads', 'localStorage']
  }
});
