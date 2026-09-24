const { APP_PERMISSIONS, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'idp_bcsc_photo';

// For BC Services Card, the Identity Provider attribute
// is the SSO Client ID. This is a temporary IDP for A PR only.
const BCSC_IDP = 'chefs-frontend-gateway-localhost-20487';

const ACTIVE = false; // until this IDP has been approved for production consider it inactive.
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').insert([
      {
        createdBy: CREATED_BY,
        code: 'bcscsandbox',
        display: 'BC Services Card Sandbox',
        active: ACTIVE,
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
