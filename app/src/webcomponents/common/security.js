const config = require('config');
const { createCHEFSSecurity } = require('../../runtime-auth/security');

/**
 * Shared CHEFS security singleton instance
 * This is created once and reused across all webcomponents routes
 */
const chefSecurity = createCHEFSSecurity({ baseUrl: config.get('server.basePath') });

module.exports = chefSecurity;
