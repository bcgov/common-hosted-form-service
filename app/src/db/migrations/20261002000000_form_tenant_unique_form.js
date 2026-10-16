/**
 * A form belongs to exactly one tenant. The original table only constrained
 * (formId, tenantId), which still allowed the same form to be migrated into two
 * different tenants — concurrent migrate requests could each pass the
 * "already migrated" check before either had committed.
 *
 * Adds a unique constraint on formId alone so the database refuses the second row
 * regardless of timing.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Pre-existing duplicates would make the constraint fail to build. Report them with
  // enough detail to resolve by hand rather than guessing which tenant to discard —
  // picking one would silently revoke access for everyone in the other.
  const duplicates = await knex('form_tenant').select('formId').groupBy('formId').havingRaw('count(*) > 1');

  if (duplicates.length > 0) {
    const formIds = duplicates.map((d) => d.formId).join(', ');
    throw new Error(
      `Cannot add unique constraint on form_tenant.formId: ${duplicates.length} form(s) belong to more than one tenant (${formIds}). ` +
        'Decide which tenant each form should keep, delete the other form_tenant row and any form_group rows for the discarded tenant, then re-run this migration.'
    );
  }

  // The composite unique is now redundant: formId alone being unique implies it.
  await knex.schema.alterTable('form_tenant', (table) => {
    table.dropUnique(['formId', 'tenantId']);
    table.unique(['formId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('form_tenant', (table) => {
    table.dropUnique(['formId']);
    table.unique(['formId', 'tenantId']);
  });
};
