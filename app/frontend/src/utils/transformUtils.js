import { IdentityMode } from '@/utils/constants';
import formioUtils from 'formiojs/utils';

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
export function generateIdps({ idps, userType }) {
  let identityProviders = [];
  if (userType === IdentityMode.LOGIN && idps && idps.length) {
    identityProviders = identityProviders.concat(idps.map((i) => ({ code: i })));
  } else if (userType === IdentityMode.PUBLIC) {
    identityProviders.push({ code: IdentityMode.PUBLIC });
  }
  return identityProviders;
}

/**
 * @function parseIdps
 * Converts identity provider objects to idps and userType
 * @param {Object[]} identityProviders An object array of identity providers
 * @returns {Object} An object containing idps and userType
 */
export function parseIdps(identityProviders) {
  const result = {
    idps: [],
    userType: IdentityMode.TEAM,
  };
  if (identityProviders && identityProviders.length) {
    if (identityProviders[0].code === IdentityMode.PUBLIC) {
      result.userType = IdentityMode.PUBLIC;
    } else {
      result.userType = IdentityMode.LOGIN;
      result.idps = identityProviders.map((ip) => ip.code);
    }
  }
  return result;
}

/**
 * @function attachAttributesToLinks
 * Attaches attributes to <a> Link tags to open in a new tab
 * @param {Component[]} formSchemaComponents An array of Components
 * @returns {void} Does not return anything. Simply transforms the Components using FormIO Utils.
 */
export function attachAttributesToLinks(formSchemaComponents) {
  const simpleContentComponents = formioUtils.searchComponents(formSchemaComponents, {
    type: 'simplecontent'
  });
  const advancedContent = formioUtils.searchComponents(formSchemaComponents, {
    type: 'content'
  });
  const combinedLinks = [...simpleContentComponents, ...advancedContent];
  combinedLinks.map((component) => {
    if (component.html && component.html.includes('<a ')) {
      component.html = component.html.replace(/<a(?![^>]+target=)/g,'<a target="_blank" rel="noopener"');
    }
  });
}
