const { APP_PERMISSIONS, Roles } = require('../../forms/common/constants');

const BCEID_EXTRAS = {
  formAccessSettings: 'idim',
  addTeamMemberSearch: {
    text: {
      minLength: 6,
      message: 'trans.manageSubmissionUsers.searchInputLength',
    },
    email: {
      exact: true,
      message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
    },
  },
  userSearch: {
    filters: [
      { name: 'filterIdpUserId', param: 'idpUserId', required: 0 },
      { name: 'filterIdpCode', param: 'idpCode', required: 0 },
      { name: 'filterUsername', param: 'username', required: 2, exact: true },
      { name: 'filterFullName', param: 'fullName', required: 0 },
      { name: 'filterFirstName', param: 'firstName', required: 0 },
      { name: 'filterLastName', param: 'lastName', required: 0 },
      { name: 'filterEmail', param: 'email', required: 2, exact: true },
      { name: 'filterSearch', param: 'search', required: 0 },
    ],
    detail: 'Could not retrieve BCeID users. Invalid options provided.',
  },
};

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .alterTable('user', function (table) {
        table.dropIndex('keycloakId');
      })
      .alterTable('identity_provider', (table) => {
        table.boolean('primary').notNullable().defaultTo(false);
        table.boolean('login').notNullable().defaultTo(false).comment('When true, supply buttons to launch login process');
        table.specificType('permissions', 'text ARRAY').comment('Map app permissions to the idp');
        table.specificType('roles', 'text ARRAY').comment('Map Form role codes to the idp');
        table.jsonb('tokenmap').comment('Map of token fields to CHEFs user fields');
        table.jsonb('extra').comment('Allow customization of the IDP though extra (json) config object.');
      })
      .then(() => knex('identity_provider').where({ code: 'public' }).update({ permissions: [], extra: {} }))
      .then(() => knex('identity_provider').where({ code: 'idir' }).update({ primary: true, login: true }))
      .then(() =>
        knex('identity_provider')
          .where({ code: 'idir' })
          .update({
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
            roles: [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER],
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
            extra: {},
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-business' })
          .update({
            idp: 'bceidbusiness',
            login: true,
            permissions: [
              APP_PERMISSIONS.VIEWS_FORM_EXPORT,
              APP_PERMISSIONS.VIEWS_FORM_MANAGE,
              APP_PERMISSIONS.VIEWS_FORM_SUBMISSIONS,
              APP_PERMISSIONS.VIEWS_FORM_TEAMS,
              APP_PERMISSIONS.VIEWS_FORM_VIEW,
              APP_PERMISSIONS.VIEWS_USER_SUBMISSIONS,
            ],
            roles: [Roles.TEAM_MANAGER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER],
            tokenmap: {
              idpUserId: 'bceid_user_guid',
              keycloakId: 'bceid_user_guid',
              username: 'bceid_username',
              firstName: null,
              lastName: null,
              fullName: 'name',
              email: 'email',
              idp: 'identity_provider',
            },
            extra: BCEID_EXTRAS,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-basic' })
          .update({
            idp: 'bceidbasic',
            login: true,
            permissions: [APP_PERMISSIONS.VIEWS_USER_SUBMISSIONS],
            roles: [Roles.FORM_SUBMITTER],
            tokenmap: {
              idpUserId: 'bceid_user_guid',
              keycloakId: 'bceid_user_guid',
              username: 'bceid_username',
              firstName: null,
              lastName: null,
              fullName: 'name',
              email: 'email',
              idp: 'identity_provider',
            },
            extra: BCEID_EXTRAS,
          })
      )
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .alterTable('user', function (table) {
        table.index('keycloakId');
      })
      .alterTable('identity_provider', (table) => {
        table.dropColumn('primary');
        table.dropColumn('login');
        table.dropColumn('permissions');
        table.dropColumn('roles');
        table.dropColumn('tokenmap');
        table.dropColumn('extra');
      })
      .then(() => knex('identity_provider').where({ code: 'bceid-business' }).update({ idp: 'bceid-business' }))
      .then(() => knex('identity_provider').where({ code: 'bceid-basic' }).update({ idp: 'bceid-basic' }))
  );
};
