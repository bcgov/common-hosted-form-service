/**
 * userOidc: Bearer <oidc-jwt> validated using existing jwtService and authService
 * Uses CHEFS services: jwtService.getTokenPayload() and authService.login()
 */

const ERRORS = require('../../errorMessages');

function canHandle(req) {
  const h = req.headers?.authorization || '';
  return /^Bearer\s+/i.test(h);
}

module.exports = function userOidcFactory({ deps }) {
  const { jwtService, authService } = deps.services || {};

  async function authenticate(req) {
    try {
      // Use existing jwtService to get and verify token payload
      const payload = await jwtService.getTokenPayload(req);
      if (!payload) {
        const err = new Error(ERRORS.MISSING_TOKEN);
        err.status = 401;
        throw err;
      }

      // Use existing authService.login to ensure user exists in system
      const token = jwtService.getBearerToken(req);
      const user = await authService.login(token);

      return {
        authType: 'user',
        strategyName: 'userOidc',
        actor: {
          type: 'user',
          subtype: user.idpCode || user.idp,
          id: user.id,
          username: user.usernameIdp || user.username || user.email || user.id,
          email: user.email,
          fullName: user.fullName,
          isAdmin: payload?.client_roles?.includes('admin') || false,
          metadata: {
            ...user,
            firstName: user.firstName,
            lastName: user.lastName,
            idpUserId: user.idpUserId,
            keycloakId: user.keycloakId,
            public: user.public || false,
            clientRoles: payload?.client_roles || [],
          },
        },
        claims: payload,
      };
    } catch (e) {
      const err = new Error(ERRORS.USER_NOT_FOUND);
      err.status = 401;
      err.cause = e;
      err.message = e?.message || ERRORS.USER_NOT_FOUND;
      throw err;
    }
  }

  return { name: 'userOidc', isPublic: false, canHandle, authenticate };
};
