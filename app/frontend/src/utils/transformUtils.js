import { IdentityMode } from '@/utils/constants';

//
// Transformation Functions for converting form objects
//

/**
 * @function generateIdps
 * Converts idps and userType to identity provider objects
 * @param {String[]} idps A string array of identity providers
 * @param {String} userType The type of users
 * @returns {Object[]} An object array of identity providers
 */
const generateIdps = ({ idps, userType }) => {
  let identityProviders = [];
  if (userType === IdentityMode.LOGIN) {
    identityProviders = identityProviders.concat(idps.map((i) => ({ code: i })));
  } else if (userType === IdentityMode.PUBLIC) {
    identityProviders.push(IdentityMode.PUBLIC);
  }
  return identityProviders;
};

/**
 * @function parseIdps
 * Converts identity provider objects to idps and userType
 * @param {Object[]} identityProviders An object array of identity providers
 * @returns {Object} An object containing idps and userType
 */
const parseIdps = (identityProviders) => {
  const result = {
    idps: [],
    userType: 'team',
  };
  if (identityProviders.length) {
    if (identityProviders[0] === IdentityMode.PUBLIC) {
      result.userType = IdentityMode.PUBLIC;
    } else {
      result.userType = IdentityMode.LOGIN;
      result.idps = identityProviders.map((ip) => ip.code);
    }
  }
  return result;
};

export { generateIdps, parseIdps };
