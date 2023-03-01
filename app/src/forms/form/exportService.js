const { Model } = require('objection');
const Problem = require('api-problem');
const {flattenComponents, unwindPath, submissionHeaders} = require('../common/utils');
const { Form, FormVersion } = require('../common/models');
const moment = require('moment');
const { Roles } = require('../common/constants');
const {  transforms } = require('json2csv');
const { Parser } = require('json2csv');


const {
  UserFormAccess
} = require('../common/models');
class SubmissionData extends Model {
  static get tableName() {
    return 'submissions_data_vw';
  }

  static get modifiers() {
    return {
      filterCreatedAt(query, minDate, maxDate) {
        if (minDate && maxDate) {
          minDate = moment(minDate).format('YYYY-MM-DD HH:MM:SS');
          maxDate = moment(maxDate).format('YYYY-MM-DD HH:MM:SS');
          query.whereBetween('createdAt', [minDate, maxDate]);
        } else if (minDate) {
          minDate = moment(minDate).format('YYYY-MM-DD HH:MM:SS');
          query.where('createdAt', '>=', minDate);
        } else if (maxDate) {
          maxDate = moment(maxDate).format('YYYY-MM-DD HH:MM:SS');
          query.where('createdAt', '<=', maxDate);
        }
      },
      filterDeleted(query, value) {
        if (!value) {
          query.where('deleted', false);
        }
      },
      filterDrafts(query, value) {
        if (!value) {
          query.where('draft', false);
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
  /**
   * @function _readSchemaFields
   * Returns a flattened, ordered array of relevant content field names with topology
   * @param {Object} schema A form.io schema
   * @returns {String[]} An array of strings
   */
  _readSchemaFields: async (schema) => {
    return  await flattenComponents(schema.components);
  },

  _buildCsvHeaders: async (form,  data, version) => {

    /**
     * get column order to match field order in form design
     * object key order is not preserved when submission JSON is saved to jsonb field type in postgres.
     */

    // get correctly ordered field names (keys) from latest form version
    const latestFormDesign = await service._readLatestFormSchema(form.id, version);

    const fieldNames = await service._readSchemaFields(latestFormDesign, data);

    // get meta properties in 'form.<child.key>' string format
    const metaKeys = Object.keys(data.length>0&&data[0].form);
    const metaHeaders = metaKeys.map(x => 'form.' + x);
    /**
     * make other changes to headers here if required
     * eg: use field labels as headers
     * see: https://github.com/kaue/jsonexport
     */
    let formSchemaheaders = metaHeaders.concat(fieldNames);
    let flattenSubmissionHeaders = Array.from(submissionHeaders(data[0]));
    let t = formSchemaheaders.concat(flattenSubmissionHeaders.filter((item) => formSchemaheaders.indexOf(item) < 0));
    return t;
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

  _getData: async(exportType,formVersion,form, params = {}) => {
    if (EXPORT_TYPES.submissions === exportType) {
      return service._getSubmissions(form, params,formVersion);
    }
    return {};
  },

  _formatData: async (exportFormat, exportType, exportTemplate, form, data = {}, columns, version) => {
    // inverting content structure nesting to prioritize submission content clarity
    const formatted = data.map(obj => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    if (EXPORT_TYPES.submissions === exportType) {
      if (EXPORT_FORMATS.csv === exportFormat) {
        return await service._formatSubmissionsCsv(form, formatted,exportTemplate, columns, version);
      }
      if (EXPORT_FORMATS.json === exportFormat) {
        return await service._formatSubmissionsJson(form, formatted);
      }
    }
    throw new Problem(422, { detail: 'Could not create an export for this form. Invalid options provided' });
  },

  _getSubmissions: async (form, params, version) => {
    let preference = params.preference?JSON.parse(params.preference):undefined;
    // params for this export include minDate and maxDate (full timestamp dates).
    let submissionData = await SubmissionData.query()
      .column(service._submissionsColumns(form, params))
      .where('formId', form.id)
      .where('version', version)
      .modify('filterCreatedAt', preference&&preference.minDate, preference&&preference.maxDate)
      .modify('filterDeleted', params.deleted)
      .modify('filterDrafts', params.drafts)
      .modify('orderDefault');
    if(params.columns){
      for(let index in submissionData) {
        let keys = Object.keys(submissionData[index].submission);
        for(let key of keys) {
          if(Array.isArray(params.columns) && !params.columns.includes(key)) {
            delete submissionData[index].submission[key];
          }
        }
      }
    } else {
      for(let index in submissionData) {
        let keys = Object.keys(submissionData[index].submission);
        for(let key of keys) {
          if(key==='submit') {
            delete submissionData[index].submission[key];
          }
        }
      }
    }
    return submissionData;
  },

  _formatSubmissionsJson: (form,data) => {
    return {
      data: data,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.json)}"`,
        'content-type': 'text/json'
      }
    };
  },

  _formatSubmissionsCsv: async (form, data, exportTemplate, columns, version) => {
    try {
      switch(exportTemplate) {
        case 'flattenedWithBlankOut':
          return service. _flattenSubmissionsCSVExport(form, data, columns, false, version);
        case 'flattenedWithFilled':
          return service. _flattenSubmissionsCSVExport(form, data, columns, true, version);
        case 'unflattened':
          return service. _unFlattenSubmissionsCSVExport(form, data, columns, version);
        default:
          // code block
      }
    }
    catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },
  _flattenSubmissionsCSVExport: async(form, data, columns, blankout, version) => {
    let pathToUnwind = await unwindPath(data);
    let headers = await service._buildCsvHeaders(form, data, version, columns);

    const opts = {
      transforms: [
        transforms.unwind({ paths: pathToUnwind, blankOut: blankout }),
        transforms.flatten({ object: true, array: true, separator: '.'}),
      ],
      fields: headers
    };
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    return {
      data: csv,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
        'content-type': 'text/csv'
      }
    };
  },
  _unFlattenSubmissionsCSVExport: async(form, data, columns, version) => {
    let headers = await service._buildCsvHeaders(form, data, version, columns);
    const opts = {
      transforms: [
        transforms.flatten({ object: true, array: true, separator: '.'}),
      ],
      fields: headers
    };
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    return {
      data: csv,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
        'content-type': 'text/csv'
      }
    };
  },
  _readLatestFormSchema: (formId, version) => {
    return FormVersion.query()
      .select('schema')
      .where('formId', formId)
      .where('version', version)
      .modify('orderVersionDescending')
      .first()
      .then((row) => row.schema);
  },

  export: async (formId, params = {}) => {
    // ok, let's determine what we are exporting and do it!!!!
    // what operation?
    // what output format?
    const exportType = service._exportType(params);
    const exportFormat = service._exportFormat(params);
    const exportTemplate = params.template?params.template:'flattenedWithFilled';
    const columns = params.columns?params.columns:undefined;
    const version = params.version?parseInt(params.version):1;
    const form = await service._getForm(formId);
    const data = await service._getData(exportType, version, form, params);
    const result = await service._formatData(exportFormat, exportType,exportTemplate, form, data, columns, version);

    return { data: result.data, headers: result.headers };
  },
  _getListSubmitersByFormId :  (formId, obj ) => {

    return [ UserFormAccess.query()
      .select('formVersionId','formName','userId','firstName','lastName', 'email')
      .where('formId',formId)
      .modify('filterActive', true)
      .modify('filterByAccess', undefined, Roles.FORM_SUBMITTER, undefined)
      .modify('orderDefault'),
    SubmissionData.query()
      .select('confirmationId', 'createdAt', 'submissionId', 'formVersionId','userId','firstName','lastName', 'email')
      .where('formId',formId)
      .modify('filterDrafts', false)
      .modify('filterDeleted', false)
      .modify('filterCreatedAt', obj.report.dates.startDate, obj.report.dates.graceDate)
      .modify('orderDefault'),
    obj
    ];
  }

};

module.exports = service;
