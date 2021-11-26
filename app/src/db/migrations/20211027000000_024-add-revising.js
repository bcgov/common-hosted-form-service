const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-024';

exports.up = function (knex) {
  return Promise.resolve()
    // Add Revising status code
    .then(() => knex('status_code').insert({ code: 'REVISING', display: 'Revising', nextCodes: ['ASSIGNED', 'COMPLETED'], createdBy: CREATED_BY }))
    // Update existing status code transitions
    .then(() => knex('status_code').where({ code: 'SUBMITTED' }).update({ nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'], updatedBy: CREATED_BY }))
    .then(() => knex('status_code').where({ code: 'ASSIGNED' }).update({ nextCodes: ['ASSIGNED', 'COMPLETED', 'REVISING'], updatedBy: CREATED_BY }))
    .then(() => knex('status_code').where({ code: 'COMPLETED' }).update({ nextCodes: ['ASSIGNED', 'REVISING'], updatedBy: CREATED_BY }))

    // Insert Revising form status code into specific forms
    .then(() => knex('form').select('id'))
    .then((forms) => {
      const formStatuses = forms.map(f => ({
        id: uuidv4(),
        formId: f.id,
        code: 'REVISING',
        createdBy: CREATED_BY
      }));
      if (formStatuses && formStatuses.length) return knex('form_status_code').insert(formStatuses);
    });
};

exports.down = function (knex) {
  return Promise.resolve()
    // Drop Revising form status code from specific forms
    .then(() => knex('form_status_code').where('code', 'REVISING').del())

    // Revert existing status code transitions
    .then(() => knex('status_code').where({ code: 'SUBMITTED' }).update({ nextCodes: ['ASSIGNED', 'COMPLETED'], updatedBy: null }))
    .then(() => knex('status_code').where({ code: 'ASSIGNED' }).update({ nextCodes: ['ASSIGNED', 'COMPLETED'], updatedBy: null }))
    .then(() => knex('status_code').where({ code: 'COMPLETED' }).update({ nextCodes: ['ASSIGNED'], updatedBy: null }))
    // Drop Revising status code
    .then(() => knex('status_code').where('createdBy', CREATED_BY).del());
};
