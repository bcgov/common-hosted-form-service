const { Model } = require('objection');
const Problem = require('api-problem');
const {flattenComponents, unwindPath, submissionHeaders} = require('../common/utils');
const { Form, FormVersion, FileStorageReservation } = require('../common/models');
const {  transforms } = require('json2csv');
const { Parser } = require('json2csv');
const { v4: uuidv4 } = require('uuid');
const fileService = require('../file/service');


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


    let formSchemaheaders = metaHeaders.concat(fieldNames);

    let flattenSubmissionHeaders = Array.from(submissionHeaders(data.length>0?data[0]:[]));
    return formSchemaheaders.concat(flattenSubmissionHeaders.filter((item) => formSchemaheaders.indexOf(item) < 0));
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

  _formatData: async (exportFormat, exportType, exportTemplate, form, data = {}, columns, version, currentUser, appcall) => {
    // inverting content structure nesting to prioritize submission content clarity
    const formatted = data.map(obj => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    if (EXPORT_TYPES.submissions === exportType) {
      if (EXPORT_FORMATS.csv === exportFormat) {
        if(appcall) {
          return await service._formatSubmissionsCsvAppCall(form, formatted,exportTemplate, columns, version, currentUser);
        } else {
          return await service._formatSubmissionsCsv(form, formatted,exportTemplate, columns, version, currentUser);
        }
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

  _formatSubmissionsCsv: async (form, data, exportTemplate, columns, version, currentUser) => {
    try {
      switch(exportTemplate) {
        case 'flattenedWithBlankOut':
          return await service._exportSubmissionToCSV( form, data, columns, false, version, currentUser, true);
        case 'flattenedWithFilled':
          return await service._exportSubmissionToCSV(form, data, columns, true, version, currentUser, true);
        case 'unflattened':
          return await service._exportSubmissionToCSV(form, data, columns, version, currentUser, true);
        default:
          // code block
      }
    }
    catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },


  _exportSubmissionToCSV: async( form, data, columns, blankout, version, flatten) => {
    let pathToUnwind = await unwindPath(data);
    let headers = await service._buildCsvHeaders(form, data, version, columns);

    let opts;
    if(flatten) {
      opts= {
        transforms: [
          transforms.unwind({ paths: pathToUnwind, blankOut: blankout }),
          transforms.flatten({ object: true, array: true, separator: '.'}),
        ],
        fields: headers
      };
    }
    else {
      opts = {
        transforms: [
          transforms.flatten({ object: true, array: true, separator: '.'}),
        ],
        fields: headers
      };
    }
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


  _formatSubmissionsCsvAppCall: async (form, data, exportTemplate, columns, version, currentUser) => {
    try {
      switch(exportTemplate) {
        case 'flattenedWithBlankOut':
          return await service._submissionsCSVExport( form, data, columns, false, version, currentUser, true,);
        case 'flattenedWithFilled':
          return await service._submissionsCSVExport(form, data, columns, true, version, currentUser, true);
        case 'unflattened':
          return await service._submissionsCSVExport(form, data, columns, version, currentUser, true);
        default:
          // code block
      }
    }
    catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },

  _submissionsCSVExport: async(form, data, columns, blankout, version, currentUser, flatten) => {
    let reservation = await service.createReservation();
    service.exportSubmissionsToCSV(form, data, columns, blankout, version, currentUser, reservation, flatten);
    return {data:reservation};
  },


  // this method is called if the request is from the frontend (vue)
  async exportSubmissionsToCSV (form, data, columns, blankout, version, currentUser, reservation, flatten) {
    let trx;
    try {
      let pathToUnwind = (data.length>0)?await unwindPath(data):[];
      let headers =await service._buildCsvHeaders(form, data, version, columns);

      let opts;

      if(flatten) {
        opts = {
          transforms: [
            transforms.unwind({ paths: pathToUnwind, blankOut: blankout }),
            transforms.flatten({ object: true, array: true, separator: '.'}),
          ],
          fields: headers
        };
      }
      else {
        opts = {
          transforms: [
            transforms.flatten({ object: true, array: true, separator: '.'}),
          ],
          fields: headers
        };
      }

      const parser = new Parser(opts);

      let csv = await parser.parse(data);

      const metadata = {};
      metadata.id = uuidv4();
      metadata.storage = 'uploads';
      metadata.originalName = form.name+'.csv';
      metadata.mimeType = 'csv';
      metadata.size = Buffer.byteLength(csv, 'utf8');
      metadata.createdBy = currentUser.usernameIdp;

      const file =await fileService.createData(metadata, csv, currentUser);

      trx = await FileStorageReservation.startTransaction();


      await FileStorageReservation.query(trx).patchAndFetchById(reservation.id, {
        ready:true,
        fileId:file.id
      });

      await trx.commit();

      return {
        data: csv,
        headers: {
          'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
          'content-type': 'text/csv'
        }
      };

    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }


  },

  readReservation(id) {
    return FileStorageReservation.query()
      .findById(id);
  },

  async createReservation() {
    let trx;
    try {
      trx = await FileStorageReservation.startTransaction();
      let obj = { id: uuidv4(),
        ready: false
      };
      await FileStorageReservation.query(trx).insert(obj);
      await trx.commit();
      return service.readReservation(obj.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
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

  export: async (formId, currentUser, params = {}) => {
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
    const result = await service._formatData(exportFormat, exportType,exportTemplate, form, data, columns, version, currentUser, params.appcall);

    return { data: result.data, headers: result.headers };
  },

};

module.exports = service;
