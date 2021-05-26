const jsonexport = require('jsonexport');
const { Model } = require('objection');
const Problem = require('api-problem');

const { Form } = require('../common/models');
const Permissions = require('../common/constants').Permissions;


class SubmissionData extends Model {
  static get tableName() {
    return 'submissions_data_vw';
  }

  static get modifiers() {
    return {
      filterCreatedAt(query, minDate, maxDate) {
        if (minDate && maxDate) {
          query.whereBetween('createdAt', [minDate, maxDate]);
        } else if (minDate) {
          query.where('createdAt', '>=', minDate);
        } else if (maxDate) {
          query.where('createdAt', '<=', maxDate);
        }
      },
      orderDefault(builder) {
        builder.orderBy('createdAt', 'DESC');
      }
    };
  }
}

const EXPORT_TYPES = Object.freeze({
  submissions: 'submissions',
  default: 'submissions'
});

const EXPORT_FORMATS = Object.freeze({
  csv: 'csv',
  json: 'json',
  default: 'csv'
});

const service = {
  _checkPermission: (currentUser, formId, permission, exportType) => {
    const form = currentUser.forms.find(x => x.formId === formId);
    if (!form || !form.permissions.includes(permission)) {
      throw new Problem(401, { detail: `Current user does not have required permission(s) to export ${exportType} data for this form.` });
    }
  },

  _exportType: (params = {}) => {
    let result = EXPORT_TYPES[params.type];
    return result ? result : EXPORT_TYPES.default;
  },

  _exportFormat: (params = {}) => {
    let result = EXPORT_FORMATS[params.format];
    return result ? result : EXPORT_FORMATS.default;
  },

  _exportFilename: (form, type, format) => {
    return `${form.snake()}_${type}.${format}`.toLowerCase();
  },

  _submissionsColumns: (form, params = {}) => {
    if (params.columns) {
      return params.columns;
    }
    // Custom columns not defined - return default column selection behavior
    let columns = [
      'confirmationId',
      'formName',
      'version',
      'createdAt',
      'fullName',
      'username',
      'email'
    ];
    // if form has 'status updates' enabled in the form settings include these in export
    if (form.enableStatusUpdates) {
      columns = columns.concat(['status', 'assignee', 'assigneeEmail']);
    }
    // and join the submission data
    return columns.concat(['submission']);
  },

  _getForm: (formId) => {
    return Form.query().findById(formId).throwIfNotFound();
  },

  _getData: (exportType, form, params = {}, currentUser) => {
    if (EXPORT_TYPES.submissions === exportType) {
      return service._getSubmissions(form, params, currentUser);
    }
    return {};
  },

  _formatData: async (exportFormat, exportType, form, data = {}) => {
    // inverting content structure nesting to prioritize submission content clarity
    const formatted = data.map(obj => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    if (EXPORT_TYPES.submissions === exportType) {
      if (EXPORT_FORMATS.csv === exportFormat) {
        return await service._formatSubmissionsCsv(form, formatted);
      }
      if (EXPORT_FORMATS.json === exportFormat) {
        return await service._formatSubmissionsJson(form, formatted);
      }
    }
    throw new Problem(422, { detail: 'Could not create an export for this form. Invalid options provided' });
  },

  _getSubmissions: (form, params, currentUser) => {
    service._checkPermission(currentUser, form.id, Permissions.SUBMISSION_READ, EXPORT_TYPES.submissions);
    // possible params for this export include minDate and maxDate (full timestamp dates).
    return SubmissionData.query()
      .column(service._submissionsColumns(form, params))
      .where('formId', form.id)
      .modify('filterCreatedAt', params.minDate, params.maxDate)
      .modify('orderDefault');
  },

  _formatSubmissionsJson: async (form, data) => {
    return {
      data: data,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.json)}"`,
        'content-type': 'text/json'
      }
    };
  },

  _formatSubmissionsCsv: async (form, data) => {
    try {
      const options = {
        fillGaps: true,
        fillTopRow: true,
        // Leaving this option here if we need it. This is the original csv setup where the submission just prints out in 1 column as JSON
        //definitions to type cast
        // typeHandlers: {
        //   Object: function (value, name) {
        //     if (value instanceof Object) {
        //       if (name === 'submission') {
        //         // not really sure what the best representation for JSON is inside a csv...
        //         // this will produce a "" string with all the fields and values like ""field"":""value""
        //         return JSON.stringify(value);
        //       }
        //     }
        //     return value;
        //   }
        // }
      };

      const csv = await jsonexport(data, options);
      return {
        data: csv,
        headers: {
          'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
          'content-type': 'text/csv'
        }
      };
    } catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },

  export: async (formId, params = {}, currentUser) => {
    //ok, let's determine what we are exporting and do it!!!!
    // what operation?
    // what output format?
    // we may need to look at the currentuser to determine if they can actually perform the operation.
    const exportType = service._exportType(params);
    const exportFormat = service._exportFormat(params);

    const form = await service._getForm(formId);
    const data = await service._getData(exportType, form, params, currentUser);
    const result = await service._formatData(exportFormat, exportType, form, data);

    return { data: result.data, headers: result.headers };
  }

};

module.exports = service;
