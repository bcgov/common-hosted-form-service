const Problem = require('api-problem');
const { flattenComponents, unwindPath, submissionHeaders } = require('../common/utils');
const { EXPORT_FORMATS, EXPORT_TYPES } = require('../common/constants');
const { Form, FormVersion, SubmissionData } = require('../common/models');
const { transforms } = require('json2csv');
const { Parser } = require('json2csv');

const service = {
  /**
   * @function _readSchemaFields
   * Returns a flattened, ordered array of relevant content field names with topology
   * @param {Object} schema A form.io schema
   * @returns {String[]} An array of strings
   */
  _readSchemaFields: async (schema) => {
    return await flattenComponents(schema.components);
  },

  _buildCsvHeaders: async (form, data, version, fields) => {
    /**
     * get column order to match field order in form design
     * object key order is not preserved when submission JSON is saved to jsonb field type in postgres.
     */

    // get correctly ordered field names (keys) from latest form version
    const latestFormDesign = await service._readLatestFormSchema(form.id, version);

    const fieldNames = await service._readSchemaFields(latestFormDesign, data);

    // get meta properties in 'form.<child.key>' string format
    const metaKeys = Object.keys(data.length > 0 && data[0].form);
    const metaHeaders = metaKeys.map((x) => 'form.' + x);
    /**
     * make other changes to headers here if required
     * eg: use field labels as headers
     * see: https://github.com/kaue/jsonexport
     */
    let formSchemaheaders = metaHeaders.concat(fieldNames);

    if (Array.isArray(data) && data.length > 0) {
      let flattenSubmissionHeaders = Array.from(submissionHeaders(data[0]));
      formSchemaheaders = formSchemaheaders.concat(flattenSubmissionHeaders.filter((item) => formSchemaheaders.indexOf(item) < 0));
    }

    if (fields) {
      return await formSchemaheaders.filter((header) => {
        if (Array.isArray(fields) && fields.includes(header)) {
          return header;
        }
      });
    }
    return formSchemaheaders;
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

  _submissionsColumns: (form) => {
    // Custom columns not defined - return default column selection behavior
    let columns = ['confirmationId', 'formName', 'version', 'createdAt', 'fullName', 'username', 'email'];
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

  _getData: async (exportType, formVersion, form, params = {}) => {
    if (EXPORT_TYPES.submissions === exportType) {
      return service._getSubmissions(form, params, formVersion);
    }
    return {};
  },

  _formatData: async (exportFormat, exportType, exportTemplate, form, data = {}, version, fields) => {
    // inverting content structure nesting to prioritize submission content clarity
    const formatted = data.map((obj) => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    if (EXPORT_TYPES.submissions === exportType) {
      if (EXPORT_FORMATS.csv === exportFormat) {
        let formVersion = version ? parseInt(version) : 1;
        return await service._formatSubmissionsCsv(form, formatted, exportTemplate, formVersion, fields);
      }
      if (EXPORT_FORMATS.json === exportFormat) {
        return await service._formatSubmissionsJson(form, formatted);
      }
    }
    throw new Problem(422, { detail: 'Could not create an export for this form. Invalid options provided' });
  },

  _getSubmissions: async (form, params, version) => {
    let preference = params.preference ? JSON.parse(params.preference) : undefined;
    // params for this export include minDate and maxDate (full timestamp dates).
    return await SubmissionData.query()
      .column(service._submissionsColumns(form, params))
      .where('formId', form.id)
      .modify('filterVersion', version)
      .modify('filterCreatedAt', preference && preference.minDate, preference && preference.maxDate)
      .modify('filterDeleted', params.deleted)
      .modify('filterDrafts', params.drafts)
      .modify('orderDefault');
  },

  _formatSubmissionsJson: (form, data) => {
    return {
      data: data,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.json)}"`,
        'content-type': 'text/json',
      },
    };
  },
  _formatSubmissionsCsv: async (form, data, exportTemplate, version, fields) => {
    try {
      switch (exportTemplate) {
        case 'flattenedWithBlankOut':
          return service._flattenedSubmissionsCSVExport(form, data, version, true, fields);
        case 'flattenedWithFilled':
          return service._flattenedSubmissionsCSVExport(form, data, version, false, fields);
        case 'flattenedWithSingleRow':
          return service._flattenedSingleRowSubmissionsCSVExport(form, data, version);
        case 'unflattened':
          return service._unFlattenSubmissionsCSVExport(form, data, version, fields);
        default:
        // code block
      }
    } catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },

  _flattenedSubmissionsCSVExport: async (form, data, version, blankout, fields) => {
    let pathToUnwind = await unwindPath(data);
    let headers = await service._buildCsvHeaders(form, data, version, fields);

    const opts = {
      transforms: [transforms.unwind({ paths: pathToUnwind, blankOut: blankout }), transforms.flatten({ object: true, array: true, separator: '.' })],
      fields: headers,
    };
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    return {
      data: csv,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
        'content-type': 'text/csv',
      },
    };
  },

  _unFlattenSubmissionsCSVExport: async (form, data, version, fields) => {
    let headers = await service._buildCsvHeaders(form, data, version, fields);
    const opts = {
      transforms: [transforms.flatten({ object: true, array: true, separator: '.' })],
      fields: headers,
    };
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    return {
      data: csv,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
        'content-type': 'text/csv',
      },
    };
  },

  _flattenedSingleRowSubmissionsCSVExport: async (form, data) => {
    const opts = {
      transforms: [transforms.flatten({ objects: true, arrays: true, separator: '.' })],
    };
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    return {
      data: csv,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
        'content-type': 'text/csv',
      },
    };
  },

  _readLatestFormSchema: (formId, version) => {
    return FormVersion.query()
      .select('schema')
      .where('formId', formId)
      .modify('filterVersion', version)
      .modify('orderVersionDescending')
      .first()
      .then((row) => row.schema);
  },

  fieldsForCSVExport: async (formId, params = {}) => {
    const form = await service._getForm(formId);
    const data = await service._getData(params.type, params.version, form, params);
    const formatted = data.map((obj) => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    return await service._buildCsvHeaders(form, formatted, params.version, undefined);
  },

  export: async (formId, params = {}) => {
    // ok, let's determine what we are exporting and do it!!!!
    // what operation?
    // what output format?
    const exportType = service._exportType(params);
    const exportFormat = service._exportFormat(params);
    const exportTemplate = params.template ? params.template : 'flattenedWithFilled';
    const form = await service._getForm(formId);
    const data = await service._getData(exportType, params.version, form, params);
    const result = await service._formatData(exportFormat, exportType, exportTemplate, form, data, params.version, params.fields);

    return { data: result.data, headers: result.headers };
  },
};

module.exports = service;
