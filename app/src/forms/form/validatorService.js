const Validator = require('formio/src/resources/Validator.js');

const service = {
  validator: undefined,
  _init: async (schema, submissionDataArray) => {
    this.validator = new Validator(schema);
    return await this._worker(submissionDataArray);
  },
  _validate: async (data) => {
    console.log(this.validator);
    return new Promise((resolve) => {
      this.validator.validate({ data }, (err) => {
        console.log(err);
        resolve(err);
      });
    });
  },
  _worker: async (submissionDataArray) => {
    let validationResults = [];
    let anyError = false;
    await Promise.all(
      submissionDataArray.map(async (singleData, index) => {
        const report = await this._validate(singleData);
        if (report !== null) {
          anyError = true;
          validationResults[index] = report;
        }
      })
    );
    return [validationResults, anyError];
  },
};

module.exports = service;
