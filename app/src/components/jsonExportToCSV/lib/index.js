/* jshint node:true */
'use strict';
/**
 * Module dependencies.
 */

/*jsonExportToCSV javascript files were extracted from https://github.com/kaue/jsonexport.
* There is a bug though it has been reported on their GitHub account.
* The bug is needed an urgent fix. This folder jsonExportToCSV will be used
* temporarily until the bug is fixed from their end
*/


const Parser = require('./parser/csv');
const EOL = require('./core/eol');


const DEFAULT_OPTIONS = {
  headers: [], //              Array
  rename: [], //               Array
  headerPathString: '.', //    String
  rowDelimiter: ',', //        String
  textDelimiter: '"', //       String
  arrayPathString: ';', //     String
  undefinedString: '', //      String
  endOfLine: EOL || '\n', //   String
  mainPathItem: null, //       String
  booleanTrueString: null, //  String
  booleanFalseString: null, // String
  includeHeaders: true, //     Boolean
  fillGaps: false, //          Boolean
  verticalOutput: true, //     Boolean
  forceTextDelimiter: false, //Boolean
};

class JSONToCSVExport {

  constructor() {

  }

  exportCSV(data, headers) {
    let callback;
    this.data = data;
    this.headers = headers;

    const options = Object.assign({}, DEFAULT_OPTIONS, this.headers);
    const parser = new Parser(options);

    return new Promise((resolve, reject) => {
      parser.parse(data, (err, result) => {
        if (callback) return callback(err, result);
        if (err) return reject(err);
        if (reject) return resolve(result);
      });
    });
  }
}

let jSONToCSVExport = new JSONToCSVExport();
module.exports = jSONToCSVExport;

