const { createHmac } = require('node:crypto');
const axios = require('axios');
const config = require('config');
const jwt = require('jsonwebtoken');
const Problem = require('api-problem');

const formService = require('../service');
const allowance = require('./allowanceService');

const ACTION = 'chefs_submit';
const VALIDITY_SECONDS = 900;
const COOKIE_PREFIX = 'chefs_turnstile_';

const requiresVerification = (form) => form.identityProviders?.some(({ code }) => code === 'public' || code === 'bceid-basic');

const cookieName = (formId) => COOKIE_PREFIX + formId.toLowerCase();
const identity = (req) => (req.currentUser.public ? 'public' : req.currentUser.id);

function getProof(req, formId) {
  const prefix = cookieName(formId) + '=';
  for (const part of req.headers.cookie?.split(';') ?? []) {
    const cookie = part.trim();
    if (!cookie.startsWith(prefix)) continue;

    try {
      const proof = jwt.verify(cookie.slice(prefix.length), config.get('server.submissionTokenKey'), {
        algorithms: ['HS256'],
        audience: ACTION,
        issuer: formId.toLowerCase(),
        subject: identity(req),
        maxAge: VALIDITY_SECONDS,
      });
      if (typeof proof.jti === 'string' && /^[a-f0-9]{64}$/.test(proof.jti) && Number.isInteger(proof.exp)) return proof;
    } catch {
      // An older cookie with a narrower path can appear before the current one.
    }
  }
  return null;
}

function requireProof(req, form) {
  if (req.apiUser || !requiresVerification(form)) return null;
  const proof = getProof(req, form.id);
  if (!proof) {
    throw new Problem(403, { detail: 'Complete bot verification before using this form.', code: 'TURNSTILE_REQUIRED' });
  }
  return proof;
}

async function hasUsableProof(req, formId) {
  const proof = getProof(req, formId);
  return Boolean(proof && (req.query?.unused !== 'true' || !(await allowance.isSpent(proof))));
}

function widgetKeys() {
  const keys = config.get('turnstile');
  const hostnames = new Set(
    (keys.hostnames ?? '')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
  );
  if (!keys.siteKey || !keys.secretKey || hostnames.size === 0) {
    throw new Problem(500, { detail: 'Bot verification is currently unavailable.' });
  }
  return { ...keys, hostnames };
}

async function readStatus(req, form) {
  const verified = !requiresVerification(form) || (await hasUsableProof(req, form.id));
  return verified ? { verified } : { verified, siteKey: widgetKeys().siteKey };
}

async function verifyChallenge(req, form) {
  if (!requiresVerification(form) || (await hasUsableProof(req, form.id))) return null;

  const token = req.body?.token;
  if (typeof token !== 'string' || !token || token.length > 2048) {
    throw new Problem(400, { detail: 'Invalid bot verification response.' });
  }

  const { secretKey, hostnames } = widgetKeys();
  const formId = form.id.toLowerCase();
  let result;
  try {
    const { data } = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', { secret: secretKey, response: token }, { timeout: 5000, maxRedirects: 0 });
    result = data;
  } catch {
    throw new Problem(502, { detail: 'Bot verification is currently unavailable.' });
  }
  if (result?.success !== true || result.action !== ACTION || result.cdata !== formId || !hostnames.has(result.hostname?.toLowerCase())) {
    throw new Problem(403, { detail: 'Bot verification failed. Please try again.' });
  }

  const signingKey = config.get('server.submissionTokenKey');
  const proofId = createHmac('sha256', signingKey).update('chefs-turnstile-proof:').update(token).digest('hex');
  const proof = jwt.sign({}, signingKey, {
    jwtid: proofId,
    algorithm: 'HS256',
    audience: ACTION,
    issuer: formId,
    subject: identity(req),
    expiresIn: VALIDITY_SECONDS,
  });
  return {
    name: cookieName(formId),
    value: proof,
    options: {
      httpOnly: true,
      secure: req.secure || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: config.get('server.basePath') + config.get('server.apiPath'),
      maxAge: VALIDITY_SECONDS * 1000,
    },
  };
}

async function requireSubmissionProof(req) {
  if (!req.apiUser) {
    const form = await formService.readFormIdentityProviders(req.params.formId);
    return requireProof(req, form);
  }
}

module.exports = {
  readStatus,
  verifyChallenge,
  requireProof,
  requireSubmissionProof,
};
