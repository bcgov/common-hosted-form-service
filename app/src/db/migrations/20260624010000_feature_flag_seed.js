const uuid = require('uuid');

const CREATED_BY = 'feature_flag_seed_migration';

const features = [
  {
    code: 'offlineForms',
    name: 'Offline Forms',
    description: 'Allow forms to be completed and submitted while offline, syncing when a connection returns.',
    allowAll: false,
  },
  {
    code: 'submitToEmail',
    name: 'Submit to Email',
    description: 'Allow form submissions to be delivered to a configured email address.',
    allowAll: false,
  },
  {
    code: 'documentGenerationV2',
    name: 'Document Generation V2',
    description: 'Existing document generation. Available to all forms.',
    allowAll: true,
  },
  {
    code: 'documentGenerationV3',
    name: 'Document Generation V3',
    description: 'Next-generation document generation (Carbone Enterprise).',
    allowAll: false,
  },
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('feature_flag').insert(
    features.map((f) => ({
      id: uuid.v4(),
      code: f.code,
      name: f.name,
      description: f.description,
      allowAll: f.allowAll,
      createdBy: CREATED_BY,
    }))
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('feature_flag')
    .whereIn(
      'code',
      features.map((f) => f.code)
    )
    .del();
};
