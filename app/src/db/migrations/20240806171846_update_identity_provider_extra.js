const BCEID_EXTRAS_EXACT_IGNORE_CASE = {
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

const BCEID_EXTRAS_EXACT = {
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
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .hasTable('identity_provider')
      .then(() =>
        knex('identity_provider').where({ code: 'bceid-business' }).update({
          extra: BCEID_EXTRAS_EXACT_IGNORE_CASE,
        })
      )
      .then(() =>
        knex('identity_provider').where({ code: 'bceid-basic' }).update({
          extra: BCEID_EXTRAS_EXACT_IGNORE_CASE,
        })
      )
  );
};
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema
      .hasTable('identity_provider')
      .then(() =>
        knex('identity_provider').where({ code: 'bceid-business' }).update({
          extra: BCEID_EXTRAS_EXACT,
        })
      )
      .then(() =>
        knex('identity_provider').where({ code: 'bceid-basic' }).update({
          extra: BCEID_EXTRAS_EXACT,
        })
      )
  );
};
