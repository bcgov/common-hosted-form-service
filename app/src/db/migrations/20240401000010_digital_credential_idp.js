const { Roles } = require('../../forms/common/constants');

const CREATED_BY = 'migration-dc-idp';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() => {
    return knex('identity_provider').insert([
      {
        createdBy: CREATED_BY,
        code: 'verified-email',
        display: 'Verified Email',
        active: true,
        idp: 'digitalcredential',
        primary: false,
        login: true,
        permissions: [],
        roles: [Roles.FORM_SUBMITTER],
        tokenmap: {
          idpUserId: 'preferred_username',
          keycloakId: 'preferred_username',
          email: 'vc_presented_attributes,email::parseJsonField',
          idp: 'identity_provider',
        },
        extra: {
          loginOptions: '&pres_req_conf_id=verified-email',
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
