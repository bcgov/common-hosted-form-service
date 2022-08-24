const config = require('config');
const log = require('./src/components/log')(module.filename);
const moment = require('moment');

/** Knex configuration
 *  Set database configuration for application and knex configuration for migrations
 *  and seeding.  Since configuration values can change via env. vars or property
 *  files, we only need one runtime 'environment' for knex.
 *
 *  Note: it appears that the knexfile must be in the root for the config values
 *  to be read correctly when running the 'npm run migrate:*' scripts.
 * @module knexfile
 * @see module:knex
 * @see module:config
 */

const types = require('pg').types;
// To handle JSON Schema validation, we treat dates and timestamps outside of the database as strings.
// Prevent the automatic conversion of dates/timestamps into Objects, leave as strings.
types.setTypeParser(1082, (value) => {
  // dates must be in the date only part of 2020-05-16T13:18:27.160Z
  return moment(value).format('YYYY-MM-DD');
});
// timestamps...
types.setTypeParser(1114, (value) => {
  return moment(value).toISOString();
});
// timestamps with zone
types.setTypeParser(1184, (value) => {
  return moment(value).toISOString();
});

const logWrapper = (level, msg) => log.log(level, msg);

module.exports = {
  client: 'pg',
  connection: {
    host: config.get('db.host'),
    user: config.get('db.username'),
    password: config.get('db.password'),
    database: config.get('db.database'),
    port: config.get('db.port')
  },
  debug: ['silly', 'debug'].includes(config.get('server.logLevel')),
  log: {
    debug: (msg) => logWrapper('debug', msg),
    deprecate: (msg) => logWrapper('warn', msg),
    error: (msg) => logWrapper('error', msg),
    info: (msg) => logWrapper('info', msg),
    silly: (msg) => logWrapper('silly', msg),
    verbose: (msg) => logWrapper('verbose', msg),
    warn: (msg) => logWrapper('warn', msg),
  },
  migrations: {
    directory: __dirname + '/src/db/migrations'
  },
  pool: {
    min: 2,
    max: 10
    // This shouldn't be here: https://github.com/knex/knex/issues/3455#issuecomment-535554401
    // propagateCreateError: false
  },
  seeds: {
    directory: __dirname + '/src/db/seeds'
  }
};
