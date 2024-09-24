/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.resolve()
  .then(() => knex.schema.alterTable('form_submission_status', table => {
    table.specificType('emailRecipients', 'text ARRAY').comment('Array of email addresses (form submitters) to deliver notifications when the status is set to revising.');
  }));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return Promise.resolve()
    .then(() => knex.schema.alterTable('form_submission_status', table => {
        table.dropColumn('emailRecipients');
    }));  
};
