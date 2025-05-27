/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const trx = await knex.transaction();
  try {
    // Add the new column to the form table
    await trx.schema.alterTable('form', function (table) {
      table.boolean('allowSubmittersToSeeAssignee').defaultTo(false);
    });
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const trx = await knex.transaction();
  try {
    // Remove the column from the form table
    await trx.schema.alterTable('form', function (table) {
      table.dropColumn('allowSubmittersToSeeAssignee');
    });
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};
