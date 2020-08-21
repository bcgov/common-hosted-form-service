const Knex = require('knex');
const knexfile = require('../../knexfile');
const log = require('npmlog');
const { Model } = require('objection');

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

    log.debug('DataConnection.checkAll', `Connect OK: ${connectOk}, Schema OK: ${schemaOk}, Models OK: ${modelsOk}`);
    this._connected = connectOk && schemaOk && modelsOk;
    if (!connectOk) {
      log.error('DataConnection.checkAll', 'Could not connect to the database, check configuration and ensure database server is running');
    }
    if (!schemaOk) {
      log.error('DataConnection.checkAll', 'Connected to the database, could not verify the schema. Ensure proper migrations have been run.');
    }
    if (!modelsOk) {
      log.error('DataConnection.checkAll', 'Connected to the database, schema is ok, could not initialize Knex Models.');
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
        log.verbose('DataConnection.checkConnection', 'Database connection ok');
      }
      else {
        log.warn('DataConnection.checkConnection', 'Database connection is read-only');
      }
      return result;
    } catch (err) {
      log.error('DataConnection.checkConnection', `Error with database connection: ${err.message}`);
      return false;
    }
  }

  /**
   *  @function checkSchema
   *  Queries the knex connection to check for the existence of the expected schema tables
   *  @returns {boolean} True if schema is ok, otherwise false
   */
  checkSchema() {
    const tables = ['form'];
    try {
      return Promise
        .all(tables.map(table => this._knex.schema.hasTable(table)))
        .then(exists => exists.every(x => x))
        .then(result => {
          if (result) log.verbose('DataConnection.checkSchema', 'Database schema ok');
          return result;
        });
    } catch (err) {
      log.error('DataConnection.checkSchema', `Error with database schema: ${err.message}`);
      log.error('DataConnection.checkSchema', err);
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
      log.verbose('DataConnection.checkModel', 'Database models ok');
      return true;
    } catch (err) {
      log.error('DataConnection.checkModel', `Error attaching Model to connection: ${err.message}`);
      log.error('DataConnection.checkModel', err);
      return false;
    }
  }
}

module.exports = DataConnection;
