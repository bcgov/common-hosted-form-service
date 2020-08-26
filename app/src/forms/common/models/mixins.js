const moment = require('moment');

/** Timestamps Objection Model Plugin
 *  Add handlers to an Objection Model
 *
 *  In order to use JSON Schema Validation, we need to treat Timestamps as strings.
 *  They still get stored as dates/timestamps, but in/out of the database they need to be strings.
 *
 *  This class will set the createdAt timestamp/string before insert and updatedAt before update.
 *  The JSON Schema validation will pass as it goes through the marshalling, expecting createdAt and updateAt as strings.
 *
 * @see module:knex
 * @see module:objection
 */

const Timestamps = (Model) => {
  return class extends Model {
    async $beforeInsert(queryContext) {
      await super.$beforeInsert(queryContext);
      this.createdAt = moment().toISOString();
    }
    async $beforeUpdate(opt, queryContext) {
      await super.$beforeUpdate(opt, queryContext);
      this.updatedAt = moment().toISOString();
    }
  };
};

module.exports.Timestamps = Timestamps;
