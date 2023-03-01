const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class SubmissionsExport extends Timestamps(Model) {
  static get tableName() {
    return 'submissions_export';
  }

  static get relationMappings() {
    const Form = require('./form');
    const FormVersion = require('./formVersion');
    const FileStorageReservation = require('./fileStorageReservation');
    const User = require('./user');

    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'submissions_export.formId',
          to: 'form.id',
        },
      },
      formVersion: {
        relation: Model.HasOneRelation,
        modelClass: FormVersion,
        join: {
          from: 'submissions_export.formVersionId',
          to: 'form_version.id',
        },
      },
      reservation: {
        relation: Model.HasOneRelation,
        modelClass: FileStorageReservation,
        join: {
          from: 'submissions_export.reservationId',
          to: 'file_storage_reservation.id',
        },
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'submissions_export.userId',
          to: 'user.id',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterFormVersionId(query, value) {
        if (value) {
          query.where('formVersionId', value);
        }
      },
      filterReservationId(query, value) {
        if (value) {
          query.where('reservationId', value);
        }
      },
      filterUserId(query, value) {
        if (value) {
          query.where('userId', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'reservationId', 'formId', 'formVersionId', 'userId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        formVersionId: { type: 'string', pattern: Regex.UUID },
        reservationId: { type: 'string', pattern: Regex.UUID },
        userId: { type: 'string', pattern: Regex.UUID },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = SubmissionsExport;
