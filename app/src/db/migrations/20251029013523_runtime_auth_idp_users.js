const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-runtime-auth-idp-users';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return (
    Promise.resolve()
      // Insert new identity providers for runtime-auth strategies
      .then(() => {
        return knex('identity_provider').insert([
          {
            createdBy: CREATED_BY,
            code: 'api',
            display: 'API Key',
            active: true,
            idp: 'api',
            primary: false,
            login: false,
            permissions: [],
            roles: [],
            tokenmap: {},
            extra: { sortOrder: 90 },
          },
          {
            createdBy: CREATED_BY,
            code: 'gateway',
            display: 'Gateway Bearer',
            active: true,
            idp: 'gateway',
            primary: false,
            login: false,
            permissions: [],
            roles: [],
            tokenmap: {},
            extra: { sortOrder: 91 },
          },
        ]);
      })
      // Insert users for runtime-auth strategies
      .then(() => {
        return knex('user').insert([
          {
            id: uuidv4(),
            createdBy: CREATED_BY,
            keycloakId: 'runtime-auth-api-user',
            username: 'api-user',
            email: 'api-user@runtime-auth.local',
            firstName: 'API',
            lastName: 'User',
            fullName: 'API User',
            idpCode: 'api',
            idpUserId: 'api-user',
          },
          {
            id: uuidv4(),
            createdBy: CREATED_BY,
            keycloakId: 'runtime-auth-gateway-user',
            username: 'gateway-user',
            email: 'gateway-user@runtime-auth.local',
            firstName: 'Gateway',
            lastName: 'User',
            fullName: 'Gateway User',
            idpCode: 'gateway',
            idpUserId: 'gateway-user',
          },
          {
            id: uuidv4(),
            createdBy: CREATED_BY,
            keycloakId: 'runtime-auth-public-user',
            username: 'public-user',
            email: 'public-user@runtime-auth.local',
            firstName: 'Public',
            lastName: 'User',
            fullName: 'Public User',
            idpCode: 'public',
            idpUserId: 'public-user',
          },
        ]);
      })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return (
    Promise.resolve()
      // Remove runtime-auth users first (due to foreign key constraints)
      .then(() => {
        return knex('user').where('createdBy', CREATED_BY).del();
      })
      // Remove runtime-auth identity providers
      .then(() => {
        return knex('identity_provider').where('createdBy', CREATED_BY).del();
      })
  );
};
