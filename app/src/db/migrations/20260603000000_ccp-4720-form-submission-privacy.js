/**
 * CCP-4720: per-form controls for public-form submission visibility.
 *
 *   enableSubmissionUrlSharing     : when true (default), anyone with the success-page URL can view the
 *                                    submission on a public form (legacy behavior). When false, the URL
 *                                    only renders the static confirmation block to anonymous viewers.
 *   enableSubmitterEmailReceipt    : shows/hides the "email me a copy" widget on the success page.
 *                                    Backfilled from showSubmissionConfirmation for existing rows.
 *   hideSubmissionContentOnSuccess : when true, the success page never renders the read-only submission
 *                                    body, regardless of viewer auth or token. Default false.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.alterTable('form', (table) => {
        table.boolean('enableSubmissionUrlSharing').notNullable().defaultTo(true);
        table.boolean('enableSubmitterEmailReceipt').notNullable().defaultTo(true);
        table.boolean('hideSubmissionContentOnSuccess').notNullable().defaultTo(false);
      })
    )
    .then(() => knex('form').update({ enableSubmitterEmailReceipt: knex.ref('showSubmissionConfirmation') }));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.dropColumn('hideSubmissionContentOnSuccess');
      table.dropColumn('enableSubmitterEmailReceipt');
      table.dropColumn('enableSubmissionUrlSharing');
    })
  );
};
