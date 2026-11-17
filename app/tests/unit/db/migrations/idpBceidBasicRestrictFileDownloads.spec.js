const Knex = require('knex');

const migration = require('../../../../src/db/migrations/20261116000000_idp_bceid_basic_restrict_file_downloads');
const { FILE_READ, decideFileRead } = require('../../../../src/forms/file/middleware/filePermissions');

// Query builder only: no connection is opened and nothing is executed.
const knex = Knex({ client: 'pg' });

afterAll(async () => {
  await knex.destroy();
});

const jsonBinding = (bindings) => JSON.parse(bindings.find((b) => typeof b === 'string' && b.startsWith('{')));

describe('20261116000000_idp_bceid_basic_restrict_file_downloads', () => {
  it('up merges the flag into the bceid-basic row only', () => {
    const { sql, bindings } = migration.up(knex).toSQL();

    expect(sql).toMatch(/^update "identity_provider" set "extra" = COALESCE\(extra, '\{\}'::jsonb\) \|\| \?::jsonb/);
    expect(sql).toMatch(/ where "code" = \?$/);
    expect(bindings[bindings.length - 1]).toBe('bceid-basic');
    expect(jsonBinding(bindings)).toEqual({ restrictFileDownloads: true });
  });

  it('up sets the flag the file read gate checks', () => {
    const { bindings } = migration.up(knex).toSQL();
    const idp = { code: 'bceid-basic', tokenmap: { username: 'bceid_username' }, extra: jsonBinding(bindings) };
    const user = { idpUserId: 'guid', usernameIdp: 'bob@bceid-basic', idp: 'bceid-basic' };
    const file = { id: 'file', formSubmissionId: 'submission', createdBy: 'bob@bceid-basic' };

    expect(decideFileRead({ file, apiUser: false, user, idp })).toBe(FILE_READ.DENY);
    expect(decideFileRead({ file, apiUser: false, user, idp: { ...idp, extra: {} } })).toBe(FILE_READ.SUBMISSION);
  });

  it('down removes the flag from the bceid-basic row only', () => {
    const { sql, bindings } = migration.down(knex).toSQL();

    expect(sql).toMatch(/^update "identity_provider" set "extra" = extra - 'restrictFileDownloads'/);
    expect(sql).toMatch(/ where "code" = \?$/);
    expect(bindings[bindings.length - 1]).toBe('bceid-basic');
  });
});
