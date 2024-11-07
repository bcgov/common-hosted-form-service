/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.alterTable('form_subscription', (table) => {
        table.boolean('eventStreamNotifications').defaultTo(false);
      })
    )
    .then(() =>
      knex.schema.alterTable('form_event_stream_config', (table) => {
        table.boolean('enabled').defaultTo(false);
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.resolve()
    .then(() =>
      knex.schema.alterTable('form_subscription', (table) => {
        table.dropColumn('eventStreamNotifications');
      })
    )
    .then(() =>
      knex.schema.alterTable('form_event_stream_config', (table) => {
        table.dropColumn('enabled');
      })
    );
};
