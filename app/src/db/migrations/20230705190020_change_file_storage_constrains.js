exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`ALTER TABLE file_storage DROP CONSTRAINT file_storage_storage_check`))
    .then(() =>
      knex.schema.raw(`ALTER TABLE file_storage ADD CONSTRAINT
          file_storage_storage_check CHECK
            ((storage = ANY (ARRAY['uploads'::text, 'localStorage'::text, 'objectStorage'::text, 'exports'::text])))`)
    );
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.raw(`ALTER TABLE file_storage DROP CONSTRAINT file_storage_storage_check`))
    .then(() =>
      knex.schema.raw(`ALTER TABLE file_storage ADD CONSTRAINT
          file_storage_storage_check CHECK
            ((storage = ANY (ARRAY['uploads'::text, 'localStorage'::text, 'objectStorage'::text, 'exports'::text])))`)
    );
};
