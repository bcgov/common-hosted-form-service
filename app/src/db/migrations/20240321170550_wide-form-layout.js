exports.up = function (knex) {
    return Promise.resolve()
      .then(() => knex.schema.alterTable('form', table => {
        table.boolean('wideFormLayout').defaultTo(false).comment('Tracks if the form should be displayed in a wide layout');
      }));
  };
  
  exports.down = function (knex) {
    return Promise.resolve()
      .then(() => knex.schema.alterTable('form', table => {
        table.dropColumn('wideFormLayout');
      }));
  };
  
