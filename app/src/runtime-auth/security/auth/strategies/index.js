/**
 * Strategy Factory
 * Creates all authentication strategies with dependencies
 *
 * @param {Object} deps - Dependencies object
 * @returns {Array} Array of strategy objects in order: userOidc, apiKeyBasic, gatewayBearer, public
 */
const userOidc = require('./userOidc');
const apiKeyBasic = require('./apiKeyBasic');
const gatewayBearer = require('./gatewayBearer');
const publicStrategy = require('./public');

module.exports = function makeAuthStrategies(deps) {
  const safeDeps = deps || {};
  return [userOidc({ deps: safeDeps }), apiKeyBasic({ deps: safeDeps }), gatewayBearer({ deps: safeDeps }), publicStrategy({ deps: safeDeps })];
};
