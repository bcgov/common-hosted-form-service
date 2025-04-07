const BCEID_EXTRAS = {
  formAccessSettings: 'idim',
  addTeamMemberSearch: {
    text: {
      minLength: 4,
      message: 'trans.manageSubmissionUsers.searchInputLength',
    },
    email: {
      exact: true,
      message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
    },
  },
};

const BCEID_EXTRAS_NEW = {
  ...BCEID_EXTRAS,
  userSearch: {
    filters: [
      { name: 'filterIdpUserId', param: 'idpUserId', required: 0 },
      { name: 'filterIdpCode', param: 'idpCode', required: 0 },
      { name: 'filterUsername', param: 'username', required: 2, exact: true, caseSensitive: false },
      { name: 'filterFullName', param: 'fullName', required: 0 },
      { name: 'filterFirstName', param: 'firstName', required: 0 },
      { name: 'filterLastName', param: 'lastName', required: 0 },
      { name: 'filterEmail', param: 'email', required: 2, exact: true, caseSensitive: false },
      { name: 'filterSearch', param: 'search', required: 0 },
    ],
    detail: 'Could not retrieve BCeID users. Invalid options provided.',
  },
};

const BCEID_EXTRAS_OLD = {
  ...BCEID_EXTRAS,
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

const BCSC_EXTRAS_OLD = {
  formAccessSettings: 'idim',
};

const UPDATED_BY = 'idp_sort_order';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .then(() =>
        knex('identity_provider')
          .where({ code: 'idir' })
          .update({
            extra: { sortOrder: 10 },
            updatedBy: UPDATED_BY,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bcservicescard' })
          .update({
            extra: {
              sortOrder: 20,
              ...BCSC_EXTRAS_OLD,
            },
            updatedBy: UPDATED_BY,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-basic' })
          .update({
            extra: { sortOrder: 30, ...BCEID_EXTRAS_NEW },
            updatedBy: UPDATED_BY,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-business' })
          .update({
            extra: { sortOrder: 40, ...BCEID_EXTRAS_NEW },
            updatedBy: UPDATED_BY,
          })
      )
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .then(() =>
        knex('identity_provider')
          .where({ code: 'idir' })
          .update({
            extra: {},
            updatedBy: `${UPDATED_BY}_rollback`,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bcservicescard' })
          .update({
            extra: BCSC_EXTRAS_OLD,
            updatedBy: `${UPDATED_BY}_rollback`,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-basic' })
          .update({
            extra: BCEID_EXTRAS_OLD,
            updatedBy: `${UPDATED_BY}_rollback`,
          })
      )
      .then(() =>
        knex('identity_provider')
          .where({ code: 'bceid-business' })
          .update({
            extra: BCEID_EXTRAS_OLD,
            updatedBy: `${UPDATED_BY}_rollback`,
          })
      )
  );
};
