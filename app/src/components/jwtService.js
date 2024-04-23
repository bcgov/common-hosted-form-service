const jose = require('jose');
const config = require('config');
const Problem = require('api-problem');

const errorToProblem = require('./errorToProblem');

const SERVICE = 'JwtService';

const jwksUri = config.get('server.oidc.jwksUri');

// Create a remote JWK set that fetches the JWK set from server with caching
const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));

class JwtService {
  constructor({ issuer, audience, maxTokenAge }) {
    if (!issuer || !audience || !maxTokenAge) {
      throw new Error('JwtService is not configured. Check configuration.');
    }

    this.audience = audience;
    this.issuer = issuer;
    this.maxTokenAge = maxTokenAge;
  }

  getBearerToken(req) {
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    // do we want to throw errors?
    return null;
  }

  async getTokenPayload(req) {
    const bear = this.getBearerToken(req);
    if (bear) {
      return await this._verify(bear);
    }
    return null;
  }

  async _verify(token) {
    // could throw JWTClaimValidationFailed (JOSEError)
    const { payload } = await jose.jwtVerify(token, JWKS, {
      clockTolerance: '15 seconds',
      issuer: this.issuer,
      audience: this.audience,
      maxTokenAge: parseInt(this.maxTokenAge),
    });
    return payload;
  }

  async validateAccessToken(token) {
    try {
      await this._verify(token);
      // these claims passed, just return true.
      return true;
    } catch (e) {
      if (e instanceof jose.errors.JOSEError) {
        return false;
      } else {
        errorToProblem(SERVICE, e);
      }
    }
  }

  protect(spec) {
    // actual middleware
    return async (req, res, next) => {
      try {
        let authorized = false;
        try {
          // get token, check if valid
          const token = this.getBearerToken(req);
          if (token) {
            const payload = await this._verify(token);
            if (spec) {
              authorized = payload.client_roles?.includes(spec);
            } else {
              authorized = true;
            }
          }
        } catch (error) {
          authorized = false;
        }
        if (!authorized) {
          throw new Problem(401, { detail: 'Access denied' });
        } else {
          return next();
        }
      } catch (error) {
        next(error);
      }
    };
  }
}

const audience = config.get('server.oidc.audience');
const issuer = config.get('server.oidc.issuer');
const maxTokenAge = config.get('server.oidc.maxTokenAge');

let jwtService = new JwtService({
  issuer: issuer,
  audience: audience,
  maxTokenAge: maxTokenAge,
});
module.exports = jwtService;
