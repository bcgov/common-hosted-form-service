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
};

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .alterTable('identity_provider', (table) => {
        table.boolean('primary').notNullable().defaultTo(false);
        table
          .boolean('login')
          .notNullable()
          .defaultTo(false)
          .comment('When true, supply buttons to launch login process');
        table
          .specificType('permissions', 'text ARRAY')
          .comment('Map app permissions to the idp');
        table
          .specificType('roles', 'text ARRAY')
          .comment('Map Form role codes to the idp');
        table
          .jsonb('extra')
          .comment(
            'Allow customization of the IDP though extra (json) config object.'
          );
      })
      .then(() =>
        knex('identity_provider')
          .where({ code: 'public' })
          .update({ permissions: [], extra: {} })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'idir' })
          .update({ primary: true, login: true })
      )
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
            roles: [
              Roles.OWNER,
              Roles.TEAM_MANAGER,
              Roles.FORM_DESIGNER,
              Roles.SUBMISSION_REVIEWER,
              Roles.FORM_SUBMITTER,
            ],
            extra: {},
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-business' })
          .update({
            login: true,
            permissions: [
              APP_PERMISSIONS.VIEWS_FORM_EXPORT,
              APP_PERMISSIONS.VIEWS_FORM_MANAGE,
              APP_PERMISSIONS.VIEWS_FORM_SUBMISSIONS,
              APP_PERMISSIONS.VIEWS_FORM_TEAMS,
              APP_PERMISSIONS.VIEWS_FORM_VIEW,
              APP_PERMISSIONS.VIEWS_USER_SUBMISSIONS,
            ],
            roles: [
              Roles.TEAM_MANAGER,
              Roles.SUBMISSION_REVIEWER,
              Roles.FORM_SUBMITTER,
            ],
            extra: BCEID_EXTRAS,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-basic' })
          .update({
            login: true,
            permissions: [APP_PERMISSIONS.VIEWS_USER_SUBMISSIONS],
            roles: [Roles.FORM_SUBMITTER],
            extra: BCEID_EXTRAS,
          })
      )
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('identity_provider', (table) => {
      table.dropColumn('primary');
      table.dropColumn('permissions');
      table.dropColumn('extra');
    })
  );
};
