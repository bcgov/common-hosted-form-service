// Service for token operations using jose

const config = require('config');
const { SignJWT, jwtVerify } = require('jose');

const JWT_LIFETIME_RAW = config.get('gateway.jwtLifetime') || '15m'; // 15 min default

function getJwtSecret() {
  if (process.env.NODE_ENV === 'production') {
    // Production must have explicit secret from config
    const secret = config.get('gateway.jwtSecret');
    if (!secret || secret.includes('REPLACE_') || secret.includes('generate')) {
      throw new Error('Production requires explicit gateway.jwtSecret configuration');
    }
    return secret;
  }

  // Non-production: always generate a random secret
  return require('node:crypto').randomBytes(32).toString('base64');
}

const JWT_SECRET = getJwtSecret();

function normalizeJwtExp(exp) {
  // Accepts seconds (number) or strings ('15m', '1h', etc)
  if (typeof exp === 'number') {
    return `${exp}s`;
  }
  if (typeof exp === 'string') {
    // If string is a number, treat as seconds
    if (/^\d+$/.test(exp)) {
      return `${exp}s`;
    }
    // Otherwise, assume jose-compatible string
    return exp;
  }
  // Fallback to 15m
  return '15m';
}

const JWT_LIFETIME = normalizeJwtExp(JWT_LIFETIME_RAW);

function getSecretKey() {
  // jose expects a Uint8Array
  return Buffer.from(JWT_SECRET, 'utf-8');
}

module.exports = {
  async createToken(payload) {
    // JWT_LIFETIME is normalized to jose-compatible string
    const jwt = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuedAt().setExpirationTime(JWT_LIFETIME).sign(getSecretKey());
    return jwt;
  },

  async refreshToken(refreshToken) {
    // For demo: just verify and issue a new token with same payload
    try {
      const { payload } = await jwtVerify(refreshToken, getSecretKey());
      // Remove iat/exp from payload
      // eslint-disable-next-line no-unused-vars
      const { iat, exp, ...rest } = payload;
      return await this.createToken(rest);
    } catch (err) {
      throw new Error('Invalid refresh token', { cause: err });
    }
  },

  async validateToken(token) {
    await jwtVerify(token, getSecretKey());
    return true;
  },

  // NEW METHOD: Verify token and return payload
  async verifyTokenAndGetPayload(token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      return { valid: true, payload };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  },

  // NEW METHOD: Get current secret for debugging (non-production only)
  getCurrentSecret() {
    if (process.env.NODE_ENV === 'production') {
      return '[REDACTED]';
    }
    return JWT_SECRET;
  },
};
