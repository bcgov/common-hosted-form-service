const Problem = require('api-problem');
const { validate: uuidValidate } = require('uuid');

const { FormSubmission } = require('../../common/models');
const log = require('../../../components/log')(module.filename);

// Dedup-Key replay middleware. On hit: returns the cached 201, skipping the
// controller (no email / file-move / event-stream re-fire). Identity mismatch
// → 409. Missing header → next() with req.dedupKey unset.
module.exports = async (req, res, next) => {
  try {
    const key = req.headers['dedup-key'];
    if (!key) return next();

    if (!uuidValidate(key)) {
      throw new Problem(400, { detail: `Invalid Dedup-Key header "${key}". Must be a UUID.` });
    }

    req.dedupKey = key;

    const existing = await FormSubmission.query().findOne({ dedupKey: key });
    if (!existing) return next();

    const replayUser = req.currentUser?.usernameIdp;
    if (existing.createdBy && replayUser && existing.createdBy !== replayUser) {
      throw new Problem(409, {
        detail: 'This Dedup-Key was created by a different user. The submission cannot be replayed under a different account.',
      });
    }

    log.info('dedup-key replay', { dedupKey: key, submissionId: existing.id, userId: req.currentUser?.id });
    return res.status(201).json(existing);
  } catch (error) {
    next(error);
  }
};
