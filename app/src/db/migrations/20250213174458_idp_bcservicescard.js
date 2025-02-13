const { APP_PERMISSIONS, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'idp_bcservicescard';

// For BC Services Card, the Identity Provider attribute
// is the SSO Client ID. This is the same for all environments except local/devcontainer.
// Our deployments (db and app container) explicitly run with NODE_ENV=production
const BCSC_IDP = process.env.NODE_ENV === 'production' ? 'chefs-frontend-5299' : 'chefs-frontend-localhost-5300';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').insert([
      {
        createdBy: CREATED_BY,
        code: 'bcservicescard',
        display: 'BC Services Card',
        active: true,
        idp: BCSC_IDP,
        primary: false,
        login: true,
        permissions: [APP_PERMISSIONS.VIEWS_USER_SUBMISSIONS],
        roles: [Roles.FORM_SUBMITTER],
        tokenmap: {
          idpUserId: 'sub',
          keycloakId: 'sub',
          idp: 'identity_provider',
          username: 'anonymous::raw',
          fullName: 'anonymous::raw',
          firstName: 'given_names',
          lastName: 'family_name',
        },
        extra: { formAccessSettings: 'idim' },
      },
    ]);
  });
};

exports.down = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').where('createdBy', CREATED_BY).del();
  });
};
