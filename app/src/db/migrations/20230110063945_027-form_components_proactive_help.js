const stamps = require('../stamps');

exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable('form_components_proactive_help', (table) => {
      table.uuid('id').primary();
      table.string('componentName').notNullable();
      table.string('externalLink');
      table.binary('image');
      table.string('imageType');
      table.string('componentImageName');
      table.string('groupName').notNullable();
      table.text('description');
      table.boolean('isLinkEnabled').defaultTo(false);
      table.boolean('publishStatus').defaultTo(false);
      stamps(knex, table);
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() => knex.schema.dropTableIfExists('form_components_proactive_help'));
};
