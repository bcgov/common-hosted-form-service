exports.up = async function (knex) {
  // Step 1: Rename columnList to columns
  await knex.raw(`
    UPDATE user_form_preferences
    SET preferences = jsonb_set(
      preferences - 'columnList',
      '{columns}',
      preferences->'columnList'
    )
    WHERE jsonb_exists(preferences, 'columnList')
  `);

  // Step 2: Move columns under submissionsTable
  await knex.raw(`
    UPDATE user_form_preferences
    SET preferences = jsonb_set(
      preferences - 'columns',
      '{submissionsTable}',
      jsonb_build_object('columns', preferences->'columns')
    )
    WHERE jsonb_exists(preferences, 'columns')
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    UPDATE user_form_preferences
    SET preferences = jsonb_set(
      preferences - 'submissionsTable',
      '{columns}',
      preferences->'submissionsTable'->'columns'
    )
    WHERE jsonb_exists(preferences, 'submissionsTable')
  `);
};
