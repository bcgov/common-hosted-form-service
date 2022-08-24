const config = require('config');
const rateLimit = require('express-rate-limit');

const publicRateLimiter = rateLimit({
  windowMs: config.get('server.rateLimit.public.windowMs'),
  max: config.get('server.rateLimit.public.max')
});

module.exports.publicRateLimiter = publicRateLimiter;
