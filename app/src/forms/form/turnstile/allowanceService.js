const Problem = require('api-problem');

const { FormSubmission } = require('../../common/models');
const log = require('../../../components/log')(module.filename);

const TABLE = 'turnstile_spent_proof';
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
let cleanupTimer;

async function isSpent(proof) {
  return Boolean(await FormSubmission.knex()(TABLE).where({ id: proof.jti }).first('id'));
}

async function consume(trx, proof) {
  if (!proof) return;

  // A simultaneous request using the same proof fails without waiting for
  // the winning transaction, even if that transaction still has files to save.
  const { rows } = await trx.raw(
    `INSERT INTO ?? (id, "expiresAt")
      SELECT ?, to_timestamp(?)
      WHERE to_timestamp(?) > clock_timestamp()
        AND pg_try_advisory_xact_lock(hashtextextended(?, 0))
      ON CONFLICT (id) DO NOTHING
      RETURNING id`,
    [TABLE, proof.jti, proof.exp, proof.exp, proof.jti]
  );

  if (!rows.length) {
    throw new Problem(403, { detail: 'Verify again before submitting.', code: 'TURNSTILE_REQUIRED' });
  }
}

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(async () => {
    try {
      // Use one bounded sweep across the replicas. The statement owns the lock.
      await FormSubmission.knex().raw(
        `WITH cleanup_lock AS MATERIALIZED (SELECT pg_try_advisory_xact_lock(826744102) AS acquired),
         expired AS (
           SELECT id FROM ??, cleanup_lock
           WHERE acquired AND "expiresAt" <= now() - interval '5 minutes'
           ORDER BY "expiresAt"
           LIMIT 10000
           FOR UPDATE OF ?? SKIP LOCKED
         )
         DELETE FROM ?? USING expired WHERE ??.id = expired.id`,
        [TABLE, TABLE, TABLE, TABLE]
      );
    } catch (error) {
      log.warn('Turnstile proof cleanup failed', { message: error.message });
    }
  }, CLEANUP_INTERVAL_MS).unref();
}

function stopCleanup() {
  clearInterval(cleanupTimer);
  cleanupTimer = undefined;
}

module.exports = { consume, isSpent, startCleanup, stopCleanup };
