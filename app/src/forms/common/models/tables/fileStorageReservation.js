const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FileStorageReservation extends Timestamps(Model) {
  static get tableName() {
    return 'file_storage_reservation';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        fileId: { type: 'string', pattern: Regex.UUID },
        ready: { type: 'boolean' },
        ...stamps
      },
      additionalProperties: false
    };
  }
}

module.exports = FileStorageReservation;
