const crypto = require('node:crypto');
const config = require('config');

const SIG_BYTES = 32;
const MAX_TTL_MINUTES = 1440;
const MIN_SECRET_BYTES = 32;

let secret;
try {
  secret = config.get('server.submissionTokenKey');
} catch {
  secret = undefined;
}
if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES) {
  throw new Error(
    `submissionTokenService: set SUBMISSION_TOKEN_KEY (or server.submissionTokenKey in local.json) to a string of at least ${MIN_SECRET_BYTES} bytes. ` +
      'Generate one with: openssl rand -hex 32'
  );
}

const ttlMinutes = Number(config.get('server.submissionTokenTtlMinutes'));
if (!Number.isInteger(ttlMinutes) || ttlMinutes < 1 || ttlMinutes > MAX_TTL_MINUTES) {
  throw new Error(`submissionTokenService: server.submissionTokenTtlMinutes must be an integer between 1 and ${MAX_TTL_MINUTES}`);
}
const TTL_MS = ttlMinutes * 60_000;

const sign = (submissionId, expiryUnixMs) => {
  return crypto.createHmac('sha256', secret).update(`${submissionId}|${expiryUnixMs}`).digest();
};

const mint = (submissionId) => {
  const expiryUnixMs = Date.now() + TTL_MS;
  const sig = sign(submissionId, expiryUnixMs).toString('hex');
  return `${submissionId}.${expiryUnixMs}.${sig}`;
};

const verify = (token, expectedSubmissionId) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, expRaw, sigHex] = parts;
  if (id !== expectedSubmissionId) return false;

  const expiryUnixMs = Number(expRaw);
  if (!Number.isFinite(expiryUnixMs) || expiryUnixMs <= Date.now()) return false;

  let presented;
  try {
    presented = Buffer.from(sigHex, 'hex');
  } catch {
    return false;
  }
  if (presented.length !== SIG_BYTES) return false;

  const expected = sign(id, expiryUnixMs);
  return crypto.timingSafeEqual(expected, presented);
};

module.exports = { mint, verify, TTL_MS };
