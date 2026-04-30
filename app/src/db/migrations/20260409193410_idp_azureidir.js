const { APP_PERMISSIONS, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'idp_azureidir';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').insert([
      {
        createdBy: CREATED_BY,
        code: 'azureidir',
        display: 'IDIR MFA',
        active: false,
        idp: 'azureidir',
        primary: true,
        login: true,
        permissions: [
          APP_PERMISSIONS.VIEWS_FORM_STEPPER,
          APP_PERMISSIONS.VIEWS_ADMIN,
          APP_PERMISSIONS.VIEWS_FILE_DOWNLOAD,
          APP_PERMISSIONS.VIEWS_FORM_EMAILS,
          APP_PERMISSIONS.VIEWS_FORM_EXPORT,
          APP_PERMISSIONS.VIEWS_FORM_MANAGE,
          APP_PERMISSIONS.VIEWS_FORM_PREVIEW,
          APP_PERMISSIONS.VIEWS_FORM_SUBMISSIONS,
          APP_PERMISSIONS.VIEWS_FORM_TEAMS,
          APP_PERMISSIONS.VIEWS_FORM_VIEW,
          APP_PERMISSIONS.VIEWS_USER_SUBMISSIONS,
        ],
        roles: [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER, Roles.SUBMISSION_APPROVER],
        tokenmap: {
          idpUserId: 'idir_user_guid',
          keycloakId: 'idir_user_guid',
          username: 'idir_username',
          firstName: 'given_name',
          lastName: 'family_name',
          fullName: 'name',
          email: 'email',
          idp: 'identity_provider',
        },
        extra: { sortOrder: 10 },
      },
    ]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').where('createdBy', CREATED_BY).del();
  });
};
