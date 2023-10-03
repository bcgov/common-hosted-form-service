module.exports = Object.freeze({
  EmailProperties: {
    FROM_EMAIL: 'donotreplyCHEFS@gov.bc.ca',
  },
  EmailTypes: {
    SUBMISSION_ASSIGNED: 'submissionAssigned',
    SUBMISSION_UNASSIGNED: 'submissionUnassigned',
    STATUS_ASSIGNED: 'statusAssigned',
    STATUS_REVISING: 'statusRevising',
    SUBMISSION_RECEIVED: 'submissionReceived',
    SUBMISSION_CONFIRMATION: 'submissionConfirmation',
    REMINDER_FORM_OPEN: 'formOpen',
    REMINDER_FORM_WILL_CLOSE: 'formWillClose',
    REMINDER_FORM_NOT_FILL: 'formNotFill',
  },
  Permissions: {
    EMAIL_TEMPLATE_READ: 'email_template_read',
    EMAIL_TEMPLATE_UPDATE: 'email_template_update',
    FORM_API_CREATE: 'form_api_create',
    FORM_API_READ: 'form_api_read',
    FORM_API_UPDATE: 'form_api_update',
    FORM_API_DELETE: 'form_api_delete',
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
    FORM_SUBMITTER: ['form_read', 'submission_create'],
  },
  Roles: {
    OWNER: 'owner',
    TEAM_MANAGER: 'team_manager',
    FORM_DESIGNER: 'form_designer',
    SUBMISSION_REVIEWER: 'submission_reviewer',
    FORM_SUBMITTER: 'form_submitter',
  },
  Regex: {
    CONFIRMATION_ID: '^[0-9A-Fa-f]{8}$',
    UUID: '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$',
    // From ajv-formats
    EMAIL: "^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$",
  },
  Statuses: {
    SUBMITTED: 'SUBMITTED',
    ASSIGNED: 'ASSIGNED',
    COMPLETED: 'COMPLETED',
    REVISING: 'REVISING',
  },
  SubscriptionEvent: {
    FORM_SUBMITTED: 'eventSubmission',
    FORM_STATUS_CHANGE: 'eventStatusChange',
    FORM_ASSIGNMENT: 'eventAssignment',
  },
  StorageTypes: {
    UPLOADS: 'uploads',
    LOCAL_STORAGE: 'localStorage',
    OBJECT_STORAGE: 'objectStorage',
    LOCAL_STORES: ['uploads', 'localStorage', 'exports'],
  },
  Restricted: {
    IDP: {
      BCEID_BASIC: 'bceid-basic',
      BCEID_BUSINESS: 'bceid-business',
    },
  },
  ScheduleType: {
    MANUAL: 'manual',
    CLOSINGDATE: 'closingDate',
    PERIOD: 'period',
  },
  IdentityProviders: {
    BCEIDBASIC: 'bceid-basic', // Basic BCeID
    BCEIDBUSINESS: 'bceid-business', // Business BCeID
    IDIR: 'idir', // IDIR
  },
  EXPORT_TYPES: {
    submissions: 'submissions',
    default: 'submissions',
  },
  EXPORT_FORMATS: {
    csv: 'csv',
    json: 'json',
    default: 'csv',
  },
});
