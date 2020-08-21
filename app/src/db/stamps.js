module.exports = (knex, table) => {
  table.string('createdBy').defaultTo('public');
  table.timestamp('createdAt', {useTz: true}).defaultTo(knex.fn.now());
  table.string('updatedBy');
  table.timestamp('updatedAt', {useTz: true}).defaultTo(knex.fn.now());
};
