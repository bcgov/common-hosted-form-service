const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const stamps = require('../jsonSchema').stamps;

class Permission extends Timestamps(Model) {
  static get tableName() {
    return 'permission';
  }

  static get relationMappings() {
    const Role = require('./role');

    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'permission.code',
          through: {
            from: 'role_permission.permission',
            to: 'role_permission.role',
          },
          to: 'role.code',
        },
      },
    };
  }

  static get modifiers() {
    return {
      filterCode(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('code', 'ilike', `%${value}%`);
        }
      },
      filterDisplay(query, value) {
        if (value) {
          // ilike is postgres case insensitive like
          query.where('display', 'ilike', `%${value}%`);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("display")');
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code', 'display'],
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 255 },
        display: { type: 'string', minLength: 1, maxLength: 255 },
        active: { type: 'boolean' },
        ...stamps,
      },
      additionalProperties: false,
    };
  }
}

module.exports = Permission;
