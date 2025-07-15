const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class Note extends Timestamps(Model) {
  static get tableName() {
    return 'note';
  }

  static get relationMappings() {
    const User = require('./user');

    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'note.userId',
          to: 'user.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterId(query, value) {
        if (value) {
          query.where('id', value);
        }
      },
      filterSubmissionId(query, value) {
        if (value) {
          query.where('submissionId', value);
        }
      },
      filterSubmissionStatusId(query, value) {
        if (value) {
          query.where('submissionId', value);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['submissionId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        submissionId: { type: 'string', pattern: Regex.UUID },
        submissionStatusId: { type: 'string', pattern: Regex.UUID },
        note: { type: ['string', 'null'], maxLength: 4000 },
        userId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = Note;
