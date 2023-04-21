/**
 * This function will be used to validate submission data
 */

const validateData = (data, validator) => {
  return new Promise((resolve) => {
    validator.validate(
      { data },
      (err) => {
        console.log(err);
        resolve(err);
      },
      (e) => {
        console.log('catch', e);
      }
    );
  });
};

module.exports = {
  validateData,
};
