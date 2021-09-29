const CREATED_BY = 'migration-022';

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => {
      return knex('identity_provider').insert([
        {
          createdBy: CREATED_BY,
          code: 'bceid-basic',
          display: 'Basic BCeID',
          active: true,
          idp: 'bceid-basic'
        },
        {
          createdBy: CREATED_BY,
          code: 'bceid-business',
          display: 'Business BCeID',
          active: true,
          idp: 'bceid-business'
        }
      ]);
    });
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => {
      return knex('identity_provider').where('createdBy', CREATED_BY).del();
    });
};
