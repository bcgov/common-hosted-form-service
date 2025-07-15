const Problem = require('api-problem');
const { flattenComponents, unwindPath, submissionHeaders } = require('../common/utils');
const { EXPORT_FORMATS, EXPORT_TYPES } = require('../common/constants');
const { Form, FormVersion, SubmissionData } = require('../common/models');
const _ = require('lodash');
const { Readable } = require('stream');
const { unwind, flatten } = require('@json2csv/transforms');
const { Transform } = require('@json2csv/node');
const fs = require('fs-extra');
const os = require('os');
const config = require('config');
const fileService = require('../file/service');
const emailService = require('../email/emailService');
const uuid = require('uuid');
const nestedObjectsUtil = require('nested-objects-util');

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

  /**
   * Help function to make header column order same as it goes in form
   */
  mapOrder: (array, order) => {
    let result = [];
    let helpMap = {};
    array.map((ar) => {
      if (ar.search(/\.\d*\./) !== -1 || ar.search(/\.\d*$/) !== -1) {
        if (helpMap[ar.replace(/\.\d*\./gi, '.')] && Array.isArray(helpMap[ar.replace(/\.\d*\./gi, '.')])) {
          helpMap[ar.replace(/\.\d*\./gi, '.')].push(ar);
          Object.assign(helpMap, { [ar.replace(/\.\d*\./gi, '.')]: helpMap[ar.replace(/\.\d*\./gi, '.')] });
        } else if (helpMap[ar.replace(/\.\d*$/gi, '')] && Array.isArray(helpMap[ar.replace(/\.\d*$/gi, '')])) {
          helpMap[ar.replace(/\.\d*$/gi, '')].push(ar);
          Object.assign(helpMap, { [ar.replace(/\.\d*$/gi, '')]: helpMap[ar.replace(/\.\d*$/gi, '')] });
        } else {
          if (ar.search(/\.\d*\./) !== -1) {
            Object.assign(helpMap, { [ar.replace(/\.\d*\./gi, '.')]: [ar] });
          } else if (ar.search(/\.\d*$/) !== -1) {
            Object.assign(helpMap, { [ar.replace(/\.\d*$/gi, '')]: [ar] });
          }
        }
      }
    });
    array.map((ar) => {
      if (ar.substring(0, 5) === 'form.') {
        result.push(ar);
      }
    });
    order.map((ord) => {
      if (array.includes(ord) && !helpMap[ord]) {
        result.push(ord);
      } else if (helpMap[ord]) {
        helpMap[ord].map((h) => result.push(h));
      } else {
        // if non of those single fields or datagrids with multi children
        // then work with possible fields with external sources as an object/json
        array.map((ar) => {
          if (ar.includes(ord)) {
            result.push(ar);
          }
        });
      }
    });
    // removing all possible duplicates
    result = [...new Set(result)];
    return result;
  },

  _buildCsvHeaders: async (form, data, version, fields, singleRow = false) => {
    /**
     * get column order to match field order in form design
     * object key order is not preserved when submission JSON is saved to jsonb field type in postgres.
     */

    // get correctly ordered field names (keys) from latest form version
    const latestFormDesign = await service._readLatestFormSchema(form.id, version);
    if (!latestFormDesign) {
      throw new Problem(400, `Form ${form.id} does not have version #${version}`);
    }

    const fieldNames = await service._readSchemaFields(latestFormDesign, data);
    // get meta properties in 'form.<child.key>' string format
    const metaKeys = Object.keys(data.length > 0 && data[0].form);
    const metaHeaders = metaKeys.map((x) => 'form.' + x);
    /**
     * make other changes to headers here if required
     * eg: use field labels as headers
     * see: https://github.com/kaue/jsonexport
     */
    let formSchemaheaders = Array.isArray(data) && data.length > 0 && !singleRow ? metaHeaders.concat(fieldNames) : metaHeaders;
    if (Array.isArray(data) && data.length > 0) {
      let flattenSubmissionHeaders = [];
      // if we generate single row headers we need to keep in mind of possible multi children nested data thus do flattening
      if (singleRow) {
        flattenSubmissionHeaders = Object.keys(nestedObjectsUtil.flatten(data));
        // '0**.field_name' removing starting digits from flaten object properies to get unique fields after
        flattenSubmissionHeaders = flattenSubmissionHeaders.map((header) => header.replace(/^\d*\./gi, ''));
        // getting unique values
        flattenSubmissionHeaders = [...new Set(flattenSubmissionHeaders)];
      } else {
        flattenSubmissionHeaders = Array.from(submissionHeaders(data[0]));
      }
      // apply help function to make header column order same as it goes in form
      const flattenSubmissionHeadersOrdered = service.mapOrder(flattenSubmissionHeaders, fieldNames);
      formSchemaheaders = formSchemaheaders.concat(flattenSubmissionHeadersOrdered.filter((item) => formSchemaheaders.indexOf(item) < 0));
    }

    if (fields) {
      return formSchemaheaders.filter((header) => {
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

  _submissionsColumns: (form, params) => {
    // Custom columns not defined - return default column selection behavior
    let columns = ['submissionId', 'confirmationId', 'formName', 'version', 'createdAt', 'fullName', 'username', 'email', 'submittedAt'];
    // if form has 'status updates' enabled in the form settings include these in export
    if (form.enableStatusUpdates) {
      columns = columns.concat(['status', 'assignee', 'assigneeEmail']);
    }
    // Let's add form level columns like deleted or draft
    if (params?.columns?.length) {
      let optionalAcceptedColumns = ['draft', 'deleted', 'updatedAt']; //'draft', 'deleted', 'updatedAt' columns needed for ETL process at this moment
      columns = columns.concat((Array.isArray(params.columns) ? [...params.columns] : [params.columns]).filter((column) => optionalAcceptedColumns.includes(column)));
    }
    // and join the submission data
    return columns.concat(['submission']);
  },

  _getForm: (formId) => {
    return Form.query().findById(formId).throwIfNotFound();
  },

  _getData: async (exportType, formVersion, form, params = {}) => {
    if (EXPORT_TYPES.submissions === exportType) {
      let subs = await service._getSubmissions(form, params, formVersion);
      return subs;
    }
    return {};
  },
  _formatData: async (exportFormat, exportType, exportTemplate, form, data = {}, columns, version, emailExport, currentUser) => {
    // inverting content structure nesting to prioritize submission content clarity
    const formatted = data.map((obj) => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    if (EXPORT_TYPES.submissions === exportType) {
      if (EXPORT_FORMATS.csv === exportFormat) {
        let formVersion = version ? parseInt(version) : 1;
        return await service._formatSubmissionsCsv(form, formatted, exportTemplate, columns, formVersion, emailExport, currentUser);
      }
      if (EXPORT_FORMATS.json === exportFormat) {
        return await service._formatSubmissionsJson(form, formatted);
      }
    }
    throw new Problem(422, {
      detail: 'Could not create an export for this form. Invalid options provided',
    });
  },

  /**
   * Parse the preferences that come in on the request.
   *
   * @param {any} preferences the preferences - probably a string or undefined
   * but unsure exactly what this could be.
   * @returns {any} the preferences. If a string was given as an argument then
   * it's treated as JSON and an object is returned.
   */
  _parsePreferences: (preferences) => {
    let parsedPreferences;
    if (preferences && _.isString(preferences)) {
      try {
        parsedPreferences = JSON.parse(preferences);
      } catch (error) {
        throw new Problem(400, {
          detail: 'Bad preferences: ' + error.message,
        });
      }
    } else {
      // What is this? How is it not a string? Is this just handling undefined?
      parsedPreferences = preferences;
    }

    return parsedPreferences;
  },

  _getSubmissions: async (form, params, version) => {
    const preference = service._parsePreferences(params.preference);

    // let submissionData;
    // params for this export include minDate and maxDate (full timestamp dates).
    return SubmissionData.query()
      .select(service._submissionsColumns(form, params))
      .where('formId', form.id)
      .modify('filterVersion', version)
      .modify('filterCreatedAt', preference && preference.minDate, preference && preference.maxDate)
      .modify('filterUpdatedAt', preference && preference.updatedMinDate, preference && preference.updatedMaxDate)
      .modify('filterStatus', params.status)
      .modify('filterDeleted', params.deleted)
      .modify('filterDrafts', params.drafts)
      .modify('orderDefault')
      .then((submissionData) => {
        if (submissionData == undefined || submissionData == null || submissionData.length == 0) return [];
        return service._submissionFilterByUnsubmit(submissionData);
      });
  },

  _submissionFilterByUnsubmit: (submissionData) => {
    for (let index in submissionData) {
      let keys = Object.keys(submissionData[index].submission);
      for (let key of keys) {
        if (key === 'submit') {
          delete submissionData[index].submission[key];
        }
      }
    }
    return submissionData;
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
  _formatSubmissionsCsv: async (form, data, exportTemplate, fields, version, emailExport, currentUser) => {
    try {
      switch (exportTemplate) {
        case 'multiRowEmptySpacesCSVExport':
          return service._multiRowsCSVExport(form, data, version, true, fields, emailExport, currentUser);
        case 'multiRowBackFilledCSVExport':
          return service._multiRowsCSVExport(form, data, version, false, fields, emailExport, currentUser);
        case 'singleRowCSVExport':
          return service._singleRowCSVExport(form, data, version, fields, currentUser, emailExport);
        case 'unFormattedCSVExport':
          return service._unFormattedCSVExport(form, data, emailExport, currentUser);
        default:
          throw new Problem(400, {
            detail: `Bad export "template" value of "${exportTemplate}"`,
          });
      }
    } catch (e) {
      if (e instanceof Problem) {
        throw e;
      }

      throw new Problem(500, {
        detail: `Could not make a csv export of submissions for this form. ${e.message}`,
      });
    }
  },
  _multiRowsCSVExport: async (form, data, version, blankout, fields, emailExport, currentUser) => {
    const pathToUnwind = await unwindPath(data);
    let headers = await service._buildCsvHeaders(form, data, version, fields);

    const opts = {
      transforms: [unwind({ paths: pathToUnwind, blankOut: blankout }), flatten({ object: true, array: true, separator: '.' })],
      fields: headers,
    };

    return service._submissionCSVExport(opts, form, data, emailExport, currentUser);
  },
  _singleRowCSVExport: async (form, data, version, fields, currentUser, emailExport) => {
    const headers = await service._buildCsvHeaders(form, data, version, fields, true);
    const opts = {
      transforms: [flatten({ objects: true, arrays: true, separator: '.' })],
      fields: headers,
    };

    return service._submissionCSVExport(opts, form, data, emailExport, currentUser);
  },
  _unFormattedCSVExport: async (form, data, emailExport, currentUser) => {
    return service._submissionCSVExport({}, form, data, emailExport, currentUser);
  },

  _submissionCSVExport(opts, form, data, emailExport, currentUser) {
    // to work with object chunk in pipe instead of Buffer
    const transformOpts = {
      objectMode: true,
    };

    const dataStream = Readable.from(data);
    const json2csvParser = new Transform(opts, transformOpts);

    let csv = [];

    if (emailExport !== 'false' && emailExport !== false) {
      // If submission count is big we're start streams parsed chunks into the temp file
      // using Nodejs fs internal library, then upload the outcome CSV file to Filestorage
      // (/myfiles folder for local machines / to Object cloud storage for other env) gathering the file storage ID
      // to use it in email for link generation for downloading...
      const path = config.get('files.localStorage.path') ? config.get('files.localStorage.path') : fs.realpathSync(os.tmpdir());
      const pathToTmpFile = `${path}/${uuid.v4()}.csv`;
      const outputStream = fs.createWriteStream(pathToTmpFile);
      dataStream.pipe(json2csvParser).pipe(outputStream);

      // Creating FileStorage instance and uploading it, so we can download it later
      outputStream.on('finish', () => {
        // Read file stats to get fie size
        fs.stat(pathToTmpFile, async (err, stats) => {
          if (err) {
            throw new Problem(400, {
              detail: `Error while trying to fetch file stats: ${err}`,
            });
          } else {
            const fileData = {
              originalname: service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv),
              mimetype: 'text/csv',
              size: stats.size,
              path: pathToTmpFile,
            };
            const fileCurrentUser = {
              usernameIdp: currentUser.usernameIdp,
            };
            // Uploading to Object storage
            const fileResult = await fileService.create(fileData, fileCurrentUser, 'exports');
            // Sending the email with link to uploaded export
            emailService.submissionExportLink(form.id, { to: currentUser.email }, fileResult.id);
          }
        });
      });
      return new Promise((resolve) =>
        resolve({
          data: null,
          headers: {
            'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
            'content-type': 'text/csv',
          },
        })
      );
    }
    // If we're working with not too many submissions, we can process parsing right away without
    // any memory constrains
    return new Promise((resolve, reject) => {
      dataStream
        .pipe(json2csvParser)
        .on('data', (chunk) => {
          csv.push(chunk.toString());
        })
        .on('finish', () => {
          resolve({
            data: csv.join(''),
            headers: {
              'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
              'content-type': 'text/csv',
            },
          });
        })
        .on('error', (err) => {
          reject({
            detail: `Error while parsing json chunk: ${err}`,
          });
        });
    });
  },

  _readLatestFormSchema: (formId, version) => {
    return FormVersion.query()
      .select('schema')
      .where('formId', formId)
      .where('version', version)
      .modify('filterVersion', version)
      .modify('orderVersionDescending')
      .first()
      .then((row) => row?.schema);
  },
  fieldsForCSVExport: async (formId, params = {}) => {
    const form = await service._getForm(formId);
    const data = await service._getData(params.type, params.version, form, params);
    // If there are no submissions then we don't need to format the data
    if ((Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) return { data: [] };

    const formatted = data.map((obj) => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    return await service._buildCsvHeaders(form, formatted, params.version, undefined, params.singleRow === 'true');
  },

  export: async (formId, params, currentUser) => {
    // ok, let's determine what we are exporting and do it!!!!
    // what operation?
    // what output format?
    const exportType = service._exportType(params);
    const exportFormat = service._exportFormat(params);
    const exportTemplate = params.template ? params.template : 'multiRowEmptySpacesCSVExport';
    const form = await service._getForm(formId);
    const data = await service._getData(exportType, params.version, form, params);
    const result = await service._formatData(exportFormat, exportType, exportTemplate, form, data, params.fields, params.version, params.emailExport, currentUser);
    return { data: result.data, headers: result.headers };
  },
};

module.exports = service;
