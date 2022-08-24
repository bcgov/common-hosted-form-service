const Knex = require('knex');
const { Model } = require('objection');

const knexfile = require('../../knexfile');
const log = require('../components/log')(module.filename);
const models = require('../../../app/src/forms/common/models');
const { tableNames } = require('../../../app/src/forms/common/models/utils');

class DataConnection {
  /**
   * Creates a new DataConnection with default (Postgresql) Knex configuration.
   * @class
   */
  constructor() {
    if (!DataConnection.instance) {
      this.knex = Knex(knexfile);
      DataConnection.instance = this;
    }

    return DataConnection.instance;
  }

  /** @function connected
   *  True or false if connected.
   */
  get connected() {
    return this._connected;
  }

  /** @function knex
   *  Gets the current knex binding
   */
  get knex() {
    return this._knex;
  }

  /** @function knex
   *  Sets the current knex binding
   *  @param {object} v - a Knex object.
   */
  set knex(v) {
    this._knex = v;
    this._connected = false;
  }

  /**
   *  @function checkAll
   *  Checks the Knex connection, the database schema, and Objection models
   *  @returns {boolean} True if successful, otherwise false
   */
  async checkAll() {
    const connectOk = await this.checkConnection();
    const schemaOk = await this.checkSchema();
    const modelsOk = this.checkModel();

    log.debug(`Connect OK: ${connectOk}, Schema OK: ${schemaOk}, Models OK: ${modelsOk}`, { function: 'checkAll' });
    this._connected = connectOk && schemaOk && modelsOk;
    if (!connectOk) {
      log.error('Could not connect to the database, check configuration and ensure database server is running', { function: 'checkAll' });
    }
    if (!schemaOk) {
      log.error('Connected to the database, could not verify the schema. Ensure proper migrations have been run.', { function: 'checkAll' });
    }
    if (!modelsOk) {
      log.error('Connected to the database, schema is ok, could not initialize Knex Models.', { function: 'checkAll' });
    }
    return this._connected;
  }

  /**
   *  @function checkConnection
   *  Checks the current knex connection to Postgres
   *  If the connected DB is in read-only mode, transaction_read_only will not be off
   *  @returns {boolean} True if successful, otherwise false
   */
  async checkConnection() {
    try {
      const data = await this.knex.raw('show transaction_read_only');
      const result = data && data.rows && data.rows[0].transaction_read_only === 'off';
      if (result) {
        log.debug('Database connection ok', { function: 'checkConnection' });
      }
      else {
        log.warn('Database connection is read-only', { function: 'checkConnection' });
      }
      return result;
    } catch (err) {
      log.error(`Error with database connection: ${err.message}`, { function: 'checkConnection' });
      return false;
    }
  }

  /**
   *  @function checkSchema
   *  Queries the knex connection to check for the existence of the expected schema tables
   *  @returns {boolean} True if schema is ok, otherwise false
   */
  checkSchema() {
    const tables = tableNames(models);
    try {
      return Promise
        .all(tables.map(table => this._knex.schema.hasTable(table)))
        .then(exists => exists.every(x => x))
        .then(result => {
          if (result) log.debug('Database schema ok', { function: 'checkSchema' });
          return result;
        });
    } catch (err) {
      log.error(`Error with database schema: ${err.message}`, { function: 'checkSchema' });
      log.error(err);
      return false;
    }
  }

  /**
   *  @function checkModel
   *  Attaches the Objection model to the existing knex connection
   *  @returns {boolean} True if successful, otherwise false
   */
  checkModel() {
    try {
      Model.knex(this.knex);
      log.debug('Database models ok', { function: 'checkModel' });
      return true;
    } catch (err) {
      log.error(`Error attaching Model to connection: ${err.message}`, { function: 'checkModel' });
      log.error(err);
      return false;
    }
  }


  /**
   * @function close
   * Will close the DataConnection
   * @param {function} [cb] Optional callback
   */
  close(cb = undefined) {
    if (this.knex) {
      try {
        this.knex.destroy(() => {
          this._connected = false;
          log.info('Disconnected', { function: 'close' });
          if (cb) cb();
        });
      } catch (e) {
        log.error(e);
      }
    }
  }

  /**
   * @function resetConnection
   * Invalidates and reconnects existing knex connection
   */
  resetConnection() {
    log.warn('Attempting to reset database connection pool...', { function: 'resetConnection' });
    this.knex.destroy(() => {
      this.knex.initialize();
    });
  }
}

module.exports = DataConnection;
