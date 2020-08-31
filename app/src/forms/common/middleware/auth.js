const DEFAULT_USER = {
  keycloakId: undefined,
  username: 'public',
  firstName: undefined,
  lastName: undefined,
  fullName: 'public',
  email: undefined,
  idp: 'public'
};

const getCurrentUserFromToken = token => {
  try {
    // identity_provider_* will be undefined if user login is to local keycloak (userid/password)
    const {
      identity_provider_identity: identity,
      identity_provider: idp,
      preferred_username: username,
      given_name: firstName,
      family_name: lastName,
      sub: keycloakId,
      name: fullName,
      email } = token.content;
    return {
      keycloakId: keycloakId,
      username: identity ? identity : username,
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      idp: idp ? idp : '',
      email: email};
  } catch (err) {
    return DEFAULT_USER;
  }
};

const getCurrentUserFromRequest = req => {
  try {
    return getCurrentUserFromToken(req.kauth.grant.access_token);
  } catch (err) {
    return DEFAULT_USER;
  }
};

/**
 * Middleware that adds a currentUser object(name, username, email) to the request.
 *
 * If user is logged in, then it will contain the data from their token.
 * If not logged in, then a default "public" user (no email) will be set instead.
 *
 */

const currentUser = async (req, res, next) => {
  req.currentUser = getCurrentUserFromRequest(req);
  next();
};

module.exports.currentUser = currentUser;
