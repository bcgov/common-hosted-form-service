const { Model } = require('objection');
const { Timestamps } = require('./mixins');
const Regex = require('../constants').Regex;
const stamps = require('./jsonSchema').stamps;

const utils = require('./utils');

class Form extends Timestamps(Model) {
  static get tableName() {
    return 'form';
  }

  static get relationMappings() {
    return {
      identityProviders: {
        relation: Model.ManyToManyRelation,
        modelClass: IdentityProvider,
        join: {
          from: 'form.id',
          through: {
            from: 'form_identity_provider.formId',
            to: 'form_identity_provider.code'
          },
          to: 'identity_provider.code'
        }
      },
      versions: {
        relation: Model.HasManyRelation,
        modelClass: FormVersion,
        join: {
          from: 'form.id',
          to: 'form_version.formId'
        }
      }
    };
  }

  static get modifiers() {
    return {
      filterName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('name', 'ilike', `%${value}%`);
        }
      },
      filterDescription(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('description', 'ilike', `%${value}%`);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterLabels(query, value) {
        if (value) {
          query.whereRaw(`'${value}' = ANY (labels)`);
        }
      },
      orderNameAscending(builder) {
        builder.orderByRaw('lower("name")');
      }
    };
  }

  // exclude labels array from explicit JSON conversion
  // encounter malformed array literal
  static get jsonAttributes() {
    return ['id', 'name', 'description', 'active', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 255 },
        active: { type: 'boolean' },
        labels: { type: 'array', items: { type: 'string' } },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class FormVersion extends Timestamps(Model) {
  static get tableName() {
    return 'form_version';
  }

  static get relationMappings() {
    return {
      submissions: {
        relation: Model.HasManyRelation,
        modelClass: FormSubmission,
        join: {
          from: 'form_version.id',
          to: 'form_submission.formVersionId'
        }
      }
    };
  }

  static get modifiers() {
    return {
      filterFormId(query, value) {
        if (value !== undefined) {
          query.where('formId', value);
        }
      },
      orderVersionDescending(builder) {
        builder.orderBy('version', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formId', 'version', 'schema'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        version: { type: 'integer' },
        schema: { type: 'jsonb' },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class FormSubmission extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission';
  }

  static get modifiers() {
    return {
      filterFormVersionId(query, value) {
        if (value !== undefined) {
          query.where('formVersionId', value);
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
      required: ['formVersionId', 'confirmationId', 'submission'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formVersionId: { type: 'string', pattern: Regex.UUID },
        confirmationId: { type: 'string', pattern: Regex.CONFIRMATION_ID },
        draft: { type: 'boolean' },
        deleted: { type: 'boolean' },
        submission: { type: 'jsonb' },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class Permission extends Timestamps(Model) {
  static get tableName() {
    return 'permission';
  }

  static get relationMappings() {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'permission.code',
          through: {
            from: 'role_permission.permission',
            to: 'role_permission.role'
          },
          to: 'role.code'
        }
      }
    };
  }

  static get modifiers() {
    return {
      filterCode(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('code', 'ilike', `%${value}%`);
        }
      },
      filterDisplay(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
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
      }
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
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class Role extends Timestamps(Model) {
  static get tableName() {
    return 'role';
  }

  static get relationMappings() {
    return {
      permissions: {
        relation: Model.ManyToManyRelation,
        modelClass: Permission,
        join: {
          from: 'role.code',
          through: {
            from: 'role_permission.role',
            to: 'role_permission.permission'
          },
          to: 'permission.code'
        }
      }
    };
  }

  static get modifiers() {
    return {
      filterCode(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('code', 'ilike', `%${value}%`);
        }
      },
      filterDisplay(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
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
      }
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
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class User extends Timestamps(Model) {
  static get tableName() {
    return 'user';
  }

  static get modifiers() {
    return {
      filterUsername(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('username', 'ilike', `%${value}%`);
        }
      },
      filterFirstName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('firstName', 'ilike', `%${value}%`);
        }
      },
      filterLastName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('lastName', 'ilike', `%${value}%`);
        }
      },
      filterFullName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('fullName', 'ilike', `%${value}%`);
        }
      },
      filterEmail(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('email', 'ilike', `%${value}%`);
        }
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['keycloakId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        keycloakId: { type: 'string', pattern: Regex.UUID },
        username: { type: ['string', 'null'], maxLength: 255 },
        firstName: { type: ['string', 'null'], maxLength: 255 },
        lastName: { type: ['string', 'null'], maxLength: 255 },
        fullName: { type: ['string', 'null'], maxLength: 255 },
        email: { type: ['string', 'null'], maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class FormRoleUser extends Timestamps(Model) {
  static get tableName() {
    return 'form_role_user';
  }

  static get relationMappings() {
    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_role_user.formId',
          to: 'form.id'
        }
      },
      userRole: {
        relation: Model.HasOneRelation,
        modelClass: Role,
        join: {
          from: 'form_role_user.role',
          to: 'role.code'
        }
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'form_role_user.userId',
          to: 'user.id'
        }
      },
    };
  }

  static get modifiers() {
    return {
      orderCreatedAtDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
      orderUpdatedAtDescending(builder) {
        builder.orderBy('updatedAt', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['role', 'formId', 'userId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        userId: { type: 'string', pattern: Regex.UUID },
        role: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class UserFormAccess extends Model {
  static get tableName() {
    return 'user_form_access_vw';
  }

  static get modifiers() {
    return {
      filterUserId(query, value) {
        if (value) {
          query.where('userId', value);
        }
      },
      filterKeycloakId(query, value) {
        if (value) {
          query.where('keycloakId', value);
        }
      },
      filterUsername(query, value) {
        if (value) {
          query.where('username', 'ilike', `%${value}%`);
        }
      },
      filterFullName(query, value) {
        if (value) {
          query.where('fullName', 'ilike', `%${value}%`);
        }
      },
      filterFirstName(query, value) {
        if (value) {
          query.where('firstName', 'ilike', `%${value}%`);
        }
      },
      filterLastName(query, value) {
        if (value) {
          query.where('lastName', 'ilike', `%${value}%`);
        }
      },
      filterEmail(query, value) {
        if (value) {
          query.where('email', 'ilike', `%${value}%`);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterFormName(query, value) {
        if (value) {
          query.where('formName', 'ilike', `%${value}%`);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterByAccess(query, idps, roles, permissions) {
        if (idps || roles || permissions) {
          const _idps = utils.toArray(idps);
          const _roles = utils.toArray(roles);
          const _permissions = utils.toArray(permissions);
          let clauses = [];

          if (_idps.length) {
            clauses.push(`('{}'::varchar[] = "roles" and (${utils.inArrayClause('idps', _idps)}))`);
          }

          if (_roles.length) {
            clauses.push(utils.inArrayFilter('roles', _roles));
          }

          if (_permissions.length) {
            clauses.push(utils.inArrayFilter('permissions', _permissions));
          }

          if (clauses.length) {
            query.whereRaw(`(${clauses.join(' or ')})`);
          }
        }
      },
      orderFormNameAscending(builder) {
        builder.orderByRaw('lower("formName")');
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName"), lower("formName")');
      }
    };
  }
}

class PublicFormAccess extends Model {
  static get tableName() {
    return 'public_form_access_vw';
  }

  static get modifiers() {
    return {
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("formName")');
      }
    };
  }
}

class IdentityProvider extends Timestamps(Model) {
  static get tableName() {
    return 'identity_provider';
  }

  static get idColumn() {
    return 'code';
  }

  static get modifiers() {
    return {
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("identity_provider"."code")');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['code', 'display', 'idp'],
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 255 },
        display: { type: 'string', minLength: 1, maxLength: 255 },
        idp: { type: 'string', minLength: 1, maxLength: 255 },
        active: { type: 'boolean' },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class FormIdentityProvider extends Timestamps(Model) {
  static get tableName() {
    return 'form_identity_provider';
  }
}

class SubmissionMetadata extends Model {
  static get tableName() {
    return 'submissions_vw';
  }

  static get modifiers() {
    return {
      filterSubmissionId(query, value) {
        if (value) {
          query.where('submissionId', value);
        }
      },
      filterConfirmationId(query, value) {
        if (value) {
          query.where('confirmationId', value);
        }
      },
      filterDraft(query, value) {
        if (value !== undefined) {
          query.where('draft', value);
        }
      },
      filterDeleted(query, value) {
        if (value !== undefined) {
          query.where('deleted', value);
        }
      },
      filterCreatedBy(query, value) {
        if (value) {
          query.where('createdBy', 'ilike', `%${value}%`);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterFormName(query, value) {
        if (value) {
          query.where('formName', 'ilike', `%${value}%`);
        }
      },
      filterFormVersionId(query, value) {
        if (value) {
          query.where('formVersionId', value);
        }
      },
      filterVersion(query, value) {
        if (value) {
          query.where('version', value);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      }
    };
  }
}

class FormSubmissionUser extends Timestamps(Model) {
  static get tableName() {
    return 'form_submission_user';
  }

  static get relationMappings() {
    return {
      submission: {
        relation: Model.HasOneRelation,
        modelClass: FormSubmission,
        join: {
          from: 'form_submission_user.submissionId',
          to: 'form_submission.id'
        }
      },
      userPermission: {
        relation: Model.HasOneRelation,
        modelClass: Permission,
        join: {
          from: 'form_submission_user.permission',
          to: 'permission.code'
        }
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'form_submission_user.userId',
          to: 'user.id'
        }
      },
    };
  }

  static get modifiers() {
    return {
      orderCreatedAtDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
      orderUpdatedAtDescending(builder) {
        builder.orderBy('updatedAt', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['permission', 'formSubmissionId', 'userId'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formSubmissionId: { type: 'string', pattern: Regex.UUID },
        userId: { type: 'string', pattern: Regex.UUID },
        permission: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

class FormSubmissionUserPermissions extends Model {
  static get tableName() {
    return 'form_submission_users_vw';
  }

  static get modifiers() {
    return {
      filterSubmissionId(query, value) {
        if (value) {
          query.where('formSubmissionId', value);
        }
      },
      filterUserId(query, value) {
        if (value) {
          query.where('userId', value);
        }
      },
      filterByPermissions(query, permissions) {
        if (permissions) {

          const _permissions = utils.toArray(permissions);
          let clauses = [];

          if (_permissions.length) {
            clauses.push(utils.inArrayFilter('permissions', _permissions));
          }

          if (clauses.length) {
            query.whereRaw(`(${clauses.join(' or ')})`);
          }
        }
      }
    };
  }
}


module.exports = {
  Form: Form,
  FormIdentityProvider: FormIdentityProvider,
  FormSubmission: FormSubmission,
  FormSubmissionUser: FormSubmissionUser,
  FormSubmissionUserPermissions: FormSubmissionUserPermissions,
  FormRoleUser: FormRoleUser,
  FormVersion: FormVersion,
  IdentityProvider: IdentityProvider,
  Permission: Permission,
  PublicFormAccess: PublicFormAccess,
  Role: Role,
  SubmissionMetadata: SubmissionMetadata,
  User: User,
  UserFormAccess: UserFormAccess
};
