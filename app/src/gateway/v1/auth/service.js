// Service for token operations using jose

const config = require('config');
const { SignJWT, jwtVerify } = require('jose');

const JWT_SECRET = config.get('gateway.jwtSecret');

const JWT_LIFETIME_RAW = config.get('gateway.jwtLifetime') || '15m'; // 15 min default

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
};
