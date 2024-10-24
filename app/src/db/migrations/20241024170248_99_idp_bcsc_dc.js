const { APP_PERMISSIONS, Roles } = require('../../forms/common/constants');

const CREATED_BY = 'migration-099';
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
        idp: 'chefs-localhost-bcservice-5754',
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
        },
      },
      {
        createdBy: CREATED_BY,
        code: 'verified-person-bcpc-dev',
        display: 'Verified Person',
        active: true,
        idp: 'digitalcredential',
        primary: false,
        login: true,
        permissions: [],
        roles: [Roles.FORM_SUBMITTER],
        tokenmap: {
          idpUserId: 'verified-person-bcpc-dev::raw',
          keycloakId: 'verified-person-bcpc-dev::raw',
          idp: 'identity_provider',
          username: 'anonymous::raw',
          fullName: 'anonymous::raw',
          // firstName: 'given_names',
          // lastName: 'family_name',
        },
        extra: {
          loginOptions: '&pres_req_conf_id=verified-person-bcpc-dev',
        },
      },
    ]);
  });
};

exports.down = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').where('createdBy', CREATED_BY).del();
  });
};
