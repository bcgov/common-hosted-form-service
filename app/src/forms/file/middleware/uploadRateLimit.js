const net = require('node:net');
const config = require('config');
const Problem = require('api-problem');
const rateLimit = require('express-rate-limit');

const idpService = require('../../../components/idpService');
const jwtService = require('../../../components/jwtService');
const log = require('../../../components/log')(module.filename);
const { restrictsFileDownloads } = require('./filePermissions');

// Limits are per pod (memory store). Starting values come from the 14 days of
// highest real usage before the abuse. Used when a setting is missing (for
// example a config directory without the server.rateLimit.fileUpload block)
// or is not a whole number in range.
const DEFAULTS = Object.freeze({
  enabled: 'true',
  windowMs: 600000,
  dailyWindowMs: 86400000,
  limitIp: 20,
  dailyLimitIp: 100,
  limitRestrictedUser: 40,
  dailyLimitRestrictedUser: 300,
  limitUser: 150,
  dailyLimitUser: 500,
});

// Node timers cannot wait longer than this; a longer window would fire the
// store's cleanup timer at once and keep emptying it.
const MAX_TIMER_MS = 2147483647;

const SETTING_PREFIX = 'server.rateLimit.fileUpload.';

const rawSetting = (key) => {
  const path = `${SETTING_PREFIX}${key}`;
  return config.has(path) ? config.get(path) : DEFAULTS[key];
};

const wholeNumber = (key, max) => {
  const raw = String(rawSetting(key)).trim();
  const value = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (Number.isSafeInteger(value) && value > 0 && value <= max) return value;
  log.warn('Invalid file upload rate limit setting, using the default', { setting: key, default: DEFAULTS[key] });
  return DEFAULTS[key];
};

const settings = Object.freeze({
  enabled: String(rawSetting('enabled')).trim().toLowerCase() !== 'false',
  windowMs: wholeNumber('windowMs', MAX_TIMER_MS),
  dailyWindowMs: wholeNumber('dailyWindowMs', MAX_TIMER_MS),
  limitIp: wholeNumber('limitIp', Number.MAX_SAFE_INTEGER),
  dailyLimitIp: wholeNumber('dailyLimitIp', Number.MAX_SAFE_INTEGER),
  limitRestrictedUser: wholeNumber('limitRestrictedUser', Number.MAX_SAFE_INTEGER),
  dailyLimitRestrictedUser: wholeNumber('dailyLimitRestrictedUser', Number.MAX_SAFE_INTEGER),
  limitUser: wholeNumber('limitUser', Number.MAX_SAFE_INTEGER),
  dailyLimitUser: wholeNumber('dailyLimitUser', Number.MAX_SAFE_INTEGER),
});

log.info('File upload rate limit settings', settings);

const ipv4ToGroups = (ipv4) => {
  const [a, b, c, d] = ipv4.split('.').map(Number);
  return [((a << 8) | b).toString(16), ((c << 8) | d).toString(16)];
};

// Expands a valid IPv6 address to its eight four-digit groups.
const expandIPv6 = (address) => {
  const toGroups = (part) => (part ? part.split(':') : []).flatMap((group) => (group.includes('.') ? ipv4ToGroups(group) : [group]));
  const halves = address.split('::');
  let groups;
  if (halves.length === 2) {
    const head = toGroups(halves[0]);
    const tail = toGroups(halves[1]);
    groups = [...head, ...new Array(8 - head.length - tail.length).fill('0'), ...tail];
  } else {
    groups = toGroups(address);
  }
  return groups.map((group) => group.toLowerCase().padStart(4, '0'));
};

const groupsToIPv4 = (high, low) => {
  const h = Number.parseInt(high, 16);
  const l = Number.parseInt(low, 16);
  return `${h >> 8}.${h & 0xff}.${l >> 8}.${l & 0xff}`;
};

/**
 * @function ipKey
 * Rate-limit key for a client address. IPv4-mapped IPv6 addresses (any
 * notation of ::ffff:a.b.c.d) are counted as their IPv4 address, and other
 * IPv6 addresses by their /64 prefix, since one subscriber usually holds a
 * whole /64.
 *
 * @param {string} ip the client address (req.ip).
 * @returns {string} the key.
 */
const ipKey = (ip) => {
  if (!ip) return 'ip:unknown';
  const address = String(ip).split('%')[0];
  if (!net.isIPv6(address)) return `ip:${address}`;

  const groups = expandIPv6(address);
  const mapped = groups.slice(0, 5).every((group) => group === '0000') && groups[5] === 'ffff';
  if (mapped) return `ip:${groupsToIPv4(groups[6], groups[7])}`;
  return `ip6:${groups.slice(0, 4).join(':')}/64`;
};

const keyOf = (req) => {
  const key = req.uploadRateLimitKey;
  if (!key) throw new Error('File upload rate limit key is missing');
  return key;
};

// Refusals also set Retry-After for limiters that send no rate-limit headers.
const refuse = (kind) => (req, res, next, options) => {
  if (!res.getHeader('Retry-After') && req.rateLimit?.resetTime) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000))));
  }
  log.warn('File upload rate limit reached', { kind, formId: String(req.query?.formId ?? '').slice(0, 64), limit: options.limit, windowMs: options.windowMs });
  next(new Problem(429, { detail: 'Too many file uploads. Please try again later.' }));
};

// One store per limiter, kept so a counted upload can be given back. Only the
// burst limiter sends rate-limit headers, so the daily one cannot overwrite
// the values that actually bind.
const limiter = (kind, limit, windowMs, headers) => {
  const store = new rateLimit.MemoryStore();
  const middleware = rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: headers ? 'draft-7' : false,
    legacyHeaders: false,
    keyGenerator: keyOf,
    handler: refuse(kind),
  });
  return { middleware, store };
};

const ipLimiters = [limiter('ip', settings.limitIp, settings.windowMs, true), limiter('ip-daily', settings.dailyLimitIp, settings.dailyWindowMs, false)];
const restrictedUserLimiters = [
  limiter('restricted-user', settings.limitRestrictedUser, settings.windowMs, true),
  limiter('restricted-user-daily', settings.dailyLimitRestrictedUser, settings.dailyWindowMs, false),
];
const userLimiters = [limiter('user', settings.limitUser, settings.windowMs, true), limiter('user-daily', settings.dailyLimitUser, settings.dailyWindowMs, false)];

// Runs the limiters in order. When all of them count the upload, the request
// gets req.uploadRateLimitRefund, which gives the upload back to each store.
const runLimiters = (limiters, key, req, res, next) => {
  req.uploadRateLimitKey = key;
  let index = 0;
  const step = (error) => {
    if (error) return next(error);
    if (index >= limiters.length) {
      req.uploadRateLimitRefund = () => Promise.all(limiters.map(({ store }) => store.decrement(key))).catch(() => undefined);
      return next();
    }
    const current = limiters[index];
    index += 1;
    return current.middleware(req, res, step);
  };
  return step();
};

/**
 * @function limitAnonymousUploads
 * Counts uploads without a Bearer token by client address. Mounted before
 * currentUser, so a refused request costs no token check, user upsert, upload
 * or scan. Requests with a Bearer token are counted by limitSignedInUploads; an
 * invalid token is refused by currentUser before that.
 */
const limitAnonymousUploads = (req, res, next) => {
  if (!settings.enabled || jwtService.getBearerToken(req)) return next();
  return runLimiters(ipLimiters, ipKey(req.ip), req, res, next);
};

/**
 * @function limitSignedInUploads
 * Counts uploads by signed-in users, by user id. Users of a provider that is
 * treated as public for file access (extra.restrictFileDownloads), or whose
 * provider is not found, get the lower restricted-user limits. A request that
 * sent a Bearer token but has no signed-in user is counted by address.
 * Requests without a Bearer token were counted by limitAnonymousUploads.
 */
const limitSignedInUploads = async (req, res, next) => {
  try {
    if (!settings.enabled) return next();

    const user = req.currentUser;
    if (!user?.idpUserId) {
      return jwtService.getBearerToken(req) ? runLimiters(ipLimiters, ipKey(req.ip), req, res, next) : next();
    }

    const idp = user.idp ? await idpService.findByCode(user.idp) : undefined;
    if (!idp || restrictsFileDownloads(idp)) {
      return runLimiters(restrictedUserLimiters, `restricted-user:${user.id}`, req, res, next);
    }

    return runLimiters(userLimiters, `user:${user.id}`, req, res, next);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  ipKey,
  limitAnonymousUploads,
  limitSignedInUploads,
  settings,
};
