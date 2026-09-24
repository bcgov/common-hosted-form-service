const Problem = require('api-problem');
const { validate: uuidValidate } = require('uuid');

const { FormSubmission } = require('../../common/models');
const log = require('../../../components/log')(module.filename);

// Dedup-Key replay middleware. On hit: returns the cached 201, skipping the
// controller (no email / file-move / event-stream re-fire). Identity mismatch
// → 409. Missing header → next() with req.dedupKey unset.
module.exports = async function checkDedupKey(req, res, next) {
  try {
    const key = req.headers['dedup-key'];
    if (!key) return next();

    if (!uuidValidate(key)) {
      throw new Problem(400, { detail: `Invalid Dedup-Key header "${key}". Must be a UUID.` });
    }

    req.dedupKey = key;

    const existing = await FormSubmission.query().findOne({ dedupKey: key });
    if (!existing) return next();

    // Replay returns the cached submission, which may contain PII, and the
    // dedupKey lookup is global (not scoped to form or user). So only replay to
    // the ORIGINAL authenticated creator — fail closed otherwise. Public /
    // anonymous submissions store createdBy='public' with no real per-user
    // identity to match, so they can never be safely replayed; and an anonymous
    // caller (usernameIdp 'public') must never receive another user's row.
    const replayUser = req.currentUser?.usernameIdp;
    const isOriginalCreator = !!replayUser && existing.createdBy !== 'public' && existing.createdBy === replayUser;
    if (!isOriginalCreator) {
      throw new Problem(409, {
        detail: 'This Dedup-Key cannot be replayed: it belongs to a different user or an anonymous submission.',
      });
    }

    log.info('dedup-key replay', { dedupKey: key, submissionId: existing.id, userId: req.currentUser?.id });
    return res.status(201).json(existing);
  } catch (error) {
    next(error);
  }
};
