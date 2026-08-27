#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/**
 * Seed and purge sample duplicate user records for exercising
 * user_duplicates_vw.
 *
 * Usage, from the app directory:
 *   node scripts/seed-duplicate-users.js seed     insert the sample records
 *   node scripts/seed-duplicate-users.js purge    delete them again
 *   node scripts/seed-duplicate-users.js status   count them and show the view
 *   node scripts/seed-duplicate-users.js verify   seed, assert, purge
 *
 * Connection comes from the knexfile, so it is always the same database the
 * migrations run against and no credentials are defined here. Set it through
 * config as usual: NODE_CONFIG_DIR, or the DB_HOST / DB_PORT / DB_USERNAME /
 * DB_PASSWORD / DB_DATABASE environment variables.
 *
 * Every inserted row carries createdBy = MARKER, and purge deletes only rows
 * matching it. Nothing else is ever touched. Any host other than localhost
 * requires ALLOW_REMOTE=1.
 */

const config = require('config');
const Knex = require('knex');
const { v4: uuidv4 } = require('uuid');

// The knexfile is loaded inside connect(), not here. It reads db.password at
// module scope, so an incomplete configuration would otherwise throw before
// this script can report it, and the app logger turns that into a stack dump
// with a success exit code.

const MARKER = 'seed-duplicate-users';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'postgres', 'db'];

/** Sample records. Each case exercises one behaviour of the view. */
function buildRows() {
  const row = (o) =>
    Object.assign(
      {
        id: uuidv4(),
        createdBy: MARKER,
        keycloakId: uuidv4(),
        idpUserId: uuidv4(),
        firstName: null,
        lastName: null,
        fullName: null,
        email: null,
        stale: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      o
    );

  return [
    // Outstanding: two active records sharing a username.
    row({ username: 'dupe.open', fullName: 'Open One', email: 'open1@gov.bc.ca', idpCode: 'idir', updatedAt: '2026-01-01T00:00:00Z' }),
    row({ username: 'dupe.open', fullName: 'Open Two', email: 'open2@gov.bc.ca', idpCode: 'idir', updatedAt: '2025-01-01T00:00:00Z' }),

    // Resolved: pair where one has been marked stale.
    row({ username: 'dupe.resolved', fullName: 'Resolved Keep', email: 'res1@gov.bc.ca', idpCode: 'idir', updatedAt: '2026-02-01T00:00:00Z' }),
    row({ username: 'dupe.resolved', fullName: 'Resolved Stale', email: 'res2@gov.bc.ca', idpCode: 'idir', stale: true }),

    // Partly handled: three records, one stale, so two remain active.
    row({ username: 'dupe.partial', fullName: 'Partial A', email: 'par1@gov.bc.ca', idpCode: 'idir', updatedAt: '2026-03-01T00:00:00Z' }),
    row({ username: 'dupe.partial', fullName: 'Partial B', email: 'par2@gov.bc.ca', idpCode: 'idir', updatedAt: '2025-03-01T00:00:00Z' }),
    row({ username: 'dupe.partial', fullName: 'Partial C', email: 'par3@gov.bc.ca', idpCode: 'idir', stale: true }),

    // Fully stale: both records marked, activeInGroup is 0.
    row({ username: 'dupe.allstale', fullName: 'All Stale One', email: 'all1@gov.bc.ca', idpCode: 'idir', stale: true }),
    row({ username: 'dupe.allstale', fullName: 'All Stale Two', email: 'all2@gov.bc.ca', idpCode: 'idir', stale: true }),

    // idir and azureidir are one canonical IdP, so these match.
    row({ username: 'dupe.canonical', fullName: 'Canon One', email: 'canon1@gov.bc.ca', idpCode: 'idir', updatedAt: '2025-04-01T00:00:00Z' }),
    row({ username: 'dupe.canonical', fullName: 'Canon Two', email: 'canon2@gov.bc.ca', idpCode: 'azureidir', updatedAt: '2026-04-01T00:00:00Z' }),

    // bceid-basic and bceid-business are separate IdPs, so these do not match.
    row({ username: 'dupe.crossidp', fullName: 'Cross One', email: 'cross@example.com', idpCode: 'bceid-basic' }),
    row({ username: 'dupe.crossidp', fullName: 'Cross Two', email: 'cross@example.com', idpCode: 'bceid-business' }),

    // Email match with padding and a zero-width character, which normalize away.
    row({ username: 'dupe.email.a', fullName: 'Email A', email: 'shared.address@gov.bc.ca', idpCode: 'idir' }),
    row({ username: 'dupe.email.b', fullName: 'Email B', email: '\tshared.address@gov.bc.ca ', idpCode: 'idir' }),
    // zero-width space written as an escape so it stays visible in source
    row({ username: 'dupe.email.c', fullName: 'Email C', email: 'shared.\u200baddress@gov.bc.ca', idpCode: 'idir' }),

    // One record in two groups: shares a username with one row, an email with another.
    row({ username: 'dupe.multi', fullName: 'Multi Anchor', email: 'multi@gov.bc.ca', idpCode: 'idir', updatedAt: '2026-05-01T00:00:00Z' }),
    row({ username: 'dupe.multi', fullName: 'Multi By Username', email: 'multi.other@gov.bc.ca', idpCode: 'idir', updatedAt: '2025-05-01T00:00:00Z' }),
    row({ username: 'dupe.solo', fullName: 'Multi By Email', email: 'multi@gov.bc.ca', idpCode: 'idir', updatedAt: '2024-05-01T00:00:00Z' }),

    // bcservicescard hardcodes username to 'anonymous', treated as a non-value.
    row({ username: 'anonymous', fullName: 'anonymous', firstName: 'Sample', lastName: 'Cardholder', idpCode: 'bcservicescard' }),
    row({ username: 'anonymous', fullName: 'anonymous', firstName: 'Sample', lastName: 'Cardholder', idpCode: 'bcservicescard' }),

    // Not a duplicate of anything.
    row({ username: 'dupe.unique', fullName: 'Unique Person', email: 'unique@gov.bc.ca', idpCode: 'idir' }),
  ];
}

function connect() {
  const host = config.get('db.host');
  const isLocal = LOCAL_HOSTS.includes(host);
  if (!isLocal && process.env.ALLOW_REMOTE !== '1') {
    throw new Error(`Refusing to run against host "${host}". Set ALLOW_REMOTE=1 to override.`);
  }
  if (!isLocal) console.warn(`WARNING: running against remote host "${host}".`);
  console.log(`Database: ${config.get('db.database')} on ${host}:${config.get('db.port')} as ${config.get('db.username')}`);

  // Same connection the migrations use. Requiring it here rather than at module
  // scope keeps a missing setting inside main()'s try, so it reports cleanly
  // and exits non-zero instead of reaching the app's uncaughtException logger.
  return Knex(require('../knexfile'));
}

async function seed(knex) {
  const existing = await knex('user').where({ createdBy: MARKER }).count('* as n').first();
  if (Number(existing.n) > 0) {
    console.log(`${existing.n} seeded records already present. Purging first.`);
    await purge(knex, true);
  }
  const rows = buildRows();
  await knex('user').insert(rows);
  console.log(`Seeded ${rows.length} records (createdBy = '${MARKER}').`);
  await status(knex);
}

async function purge(knex, quiet) {
  const ids = (await knex('user').where({ createdBy: MARKER }).select('id')).map((r) => r.id);
  if (!ids.length) {
    if (!quiet) console.log('Nothing to purge.');
    return 0;
  }
  // Children first, scoped to the seeded ids.
  await knex('user_login_history').whereIn('userId', ids).del();
  const deleted = await knex('user').where({ createdBy: MARKER }).del();
  console.log(`Purged ${deleted} seeded records.`);
  return deleted;
}

function seededIds(knex) {
  return knex('user').where({ createdBy: MARKER }).select('id');
}

async function status(knex) {
  const seeded = await knex('user').where({ createdBy: MARKER }).count('* as n').first();
  const total = await knex('user').count('* as n').first();
  console.log(`\nSeeded records: ${seeded.n}   Total users: ${total.n}`);

  const rows = await knex('user_duplicates_vw')
    .whereIn('userId', seededIds(knex))
    .orderBy(['canonicalIdp', 'matchType', 'matchKey', { column: 'lastActivityAt', order: 'desc' }]);

  if (!rows.length) {
    console.log('No rows in user_duplicates_vw for the seeded records.');
    return;
  }
  console.log(`\nuser_duplicates_vw (${rows.length} rows for seeded records):`);
  console.table(
    rows.map((r) => ({
      idp: r.canonicalIdp,
      type: r.matchType,
      key: String(r.matchKey).slice(0, 26),
      size: r.groupSize,
      active: r.activeInGroup,
      resolved: r.isResolved,
      groups: r.groupsForThisUser,
      stale: r.stale,
      user: r.username,
      name: r.fullName,
    }))
  );
  console.log(`Outstanding rows (WHERE NOT "isResolved"): ${rows.filter((r) => !r.isResolved).length}`);
}

async function verify(knex) {
  await seed(knex);
  const rows = await knex('user_duplicates_vw').whereIn('userId', seededIds(knex));
  const group = (type, key) => rows.filter((r) => r.matchType === type && r.matchKey === key);
  const checks = [];
  const check = (name, ok) => checks.push([name, ok]);

  const open = group('username', 'dupe.open');
  check('open pair present, 2 active, not resolved', open.length === 2 && open[0].activeInGroup === 2 && open[0].isResolved === false);

  const resolved = group('username', 'dupe.resolved');
  check('one-stale pair is resolved, both rows retained', resolved.length === 2 && resolved[0].activeInGroup === 1 && resolved[0].isResolved === true);
  check('stale flag exposed per record', resolved.filter((r) => r.stale).length === 1);

  const partial = group('username', 'dupe.partial');
  check('three with one stale stays outstanding', partial.length === 3 && partial[0].activeInGroup === 2 && partial[0].isResolved === false);

  const allstale = group('username', 'dupe.allstale');
  check('fully stale group has activeInGroup 0 and is resolved', allstale.length === 2 && allstale[0].activeInGroup === 0 && allstale[0].isResolved === true);

  const canonical = group('username', 'dupe.canonical');
  check('idir and azureidir match as one canonical IdP', canonical.length === 2 && canonical[0].canonicalIdp === 'idir');
  check('bceid-basic and bceid-business do not match', group('username', 'dupe.crossidp').length === 0 && group('email', 'cross@example.com').length === 0);
  check('padded and zero-width emails normalize together', group('email', 'shared.address@gov.bc.ca').length === 3);
  check('anonymous username forms no group', group('username', 'anonymous').length === 0);
  check('unique record absent', !rows.some((r) => r.username === 'dupe.unique'));

  const multi = rows.find((r) => r.username === 'dupe.multi' && r.matchType === 'email');
  check('groupsForThisUser counts both groups', multi && multi.groupsForThisUser === 2);

  const filtered = await knex('user_duplicates_vw').where('matchType', 'email').whereIn('userId', seededIds(knex));
  const multiFiltered = filtered.find((r) => r.username === 'dupe.multi');
  check('groupsForThisUser survives a filter on the view', multiFiltered && multiFiltered.groupsForThisUser === 2);

  const outstanding = await knex('user_duplicates_vw').where('isResolved', false).whereIn('userId', seededIds(knex));
  check('isResolved toggle hides resolved groups', outstanding.every((r) => r.isResolved === false) && outstanding.length < rows.length);

  console.log('\nChecks:');
  checks.forEach(([name, ok]) => console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}`));
  const failed = checks.filter((c) => !c[1]).length;
  console.log(failed === 0 ? `\nAll ${checks.length} checks passed.` : `\n${failed} of ${checks.length} checks FAILED.`);

  await purge(knex);
  return failed;
}

async function main() {
  const command = (process.argv[2] || '').toLowerCase();
  if (!['seed', 'purge', 'status', 'verify'].includes(command)) {
    console.error('Usage: node scripts/seed-duplicate-users.js <seed|purge|status|verify>');
    process.exit(1);
  }
  let knex = null;
  let failed = 0;
  try {
    knex = connect();
    if (command === 'seed') await seed(knex);
    else if (command === 'purge') await purge(knex);
    else if (command === 'status') await status(knex);
    else failed = await verify(knex);
  } catch (err) {
    console.error(`\n${err.message}`);
    failed = 1;
  } finally {
    if (knex) await knex.destroy();
  }
  process.exit(failed ? 1 : 0);
}

main();
