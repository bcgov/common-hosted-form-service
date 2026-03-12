/**
 * Generate standardized currentUser object for backward compatibility
 * Used by strategies to create req.currentUser and req.apiUser
 */

/**
 * Generate currentUser based on actor type
 * All actors now have real user data in metadata from database
 * @param {Object} actor - Actor object from strategy
 * @returns {Object} currentUser object
 */
function generateCurrentUserFromActor(actor) {
  // All actors now have real user data in metadata
  if (actor.metadata) {
    return {
      id: actor.id,
      username: actor.username,
      email: actor.email,
      fullName: actor.fullName,
      firstName: actor.firstName,
      lastName: actor.lastName,
      idpCode: actor.idpCode,
      idpUserId: actor.idpUserId,
      keycloakId: actor.keycloakId,
      public: actor.type === 'public',
      usernameIdp: actor.usernameIdp || actor.metadata?.usernameIdp || actor.username,
      clientRoles: actor.metadata?.clientRoles || [],
    };
  }

  // Fallback for any actors without metadata (shouldn't happen with new implementation)
  return {
    id: actor.id || 'unknown',
    username: actor.username || 'unknown',
    fullName: actor.fullName || 'unknown',
    public: actor.type === 'public',
  };
}

/**
 * Determine if actor is an API user
 * @param {Object} actor - Actor object
 * @returns {boolean} True if API user
 */
function isApiUser(actor) {
  return actor.type === 'apiKey' || actor.type === 'gateway';
}

/**
 * Determine if actor is a real authenticated user
 * @param {Object} actor - Actor object
 * @returns {boolean} True if real user
 */
function isRealUser(actor) {
  return actor.type === 'user';
}

/**
 * Determine if actor is public
 * @param {Object} actor - Actor object
 * @returns {boolean} True if public
 */
function isPublicUser(actor) {
  return actor.type === 'public';
}

module.exports = {
  generateCurrentUserFromActor,
  isApiUser,
  isRealUser,
  isPublicUser,
};
