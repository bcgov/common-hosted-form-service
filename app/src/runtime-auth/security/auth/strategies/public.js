/**
 * public: only valid when NO Authorization header is present and policy allows 'public'
 */

const ERRORS = require('../../errorMessages');

function canHandle(req) {
  const h = req.headers?.authorization;
  return h === undefined || h === null;
}

module.exports = function publicFactory({ deps }) {
  const { authService } = deps.services || {};

  async function authenticate() {
    try {
      // Fetch real user data from database
      const user = await authService.readUser('runtime-auth-public-user');

      return {
        authType: 'public',
        strategyName: 'public',
        actor: {
          type: 'public',
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          idpCode: user.idpCode,
          idpUserId: user.idpUserId,
          keycloakId: user.keycloakId,
          metadata: {
            // Include all user fields for currentUser generation
            ...user,
          },
        },
        claims: { public: true },
      };
    } catch (e) {
      const err = new Error(ERRORS.USER_NOT_FOUND);
      err.status = 401;
      err.cause = e;
      err.message = e?.message || ERRORS.USER_NOT_FOUND;
      throw err;
    }
  }

  return { name: 'public', isPublic: true, canHandle, authenticate };
};
