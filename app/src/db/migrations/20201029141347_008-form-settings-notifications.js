
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form', table => {
      table.boolean('showSubmissionConfirmation').notNullable().defaultTo(true).comment('Show (when true) confirmation/receipt information to the submitter on success');
      table.specificType('submissionReceivedEmails', 'text ARRAY').comment('Array of email addresses to deliver notifications after a submission is received.');
    }));
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('showSubmissionConfirmation');
      table.dropColumn('submissionReceivedEmails');
    }));
};
