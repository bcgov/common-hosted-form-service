const Validator = require('formio/src/resources/Validator.js');

/**
 * This function will be used to validate submission data
 */

function validate(data, schema) {
  return new Promise((resolve) => {
    const validator = new Validator(schema);
    validator.validate({ data }, (err) => {
      resolve(err);
    });
  });
}

module.exports = {
  validate,
};
