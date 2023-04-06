const Problem = require('api-problem');
const Objection = require('objection');

module.exports.dataErrors = async (err, req, res, next) => {
  let error = err;
  if (err instanceof Objection.NotFoundError) {
    error = new Problem(404, {
      detail: "Sorry... we still haven't found what you're looking for :(",
    });
  } else if (err instanceof Objection.ValidationError) {
    error = new Problem(422, {
      detail: 'Validation Error',
      errors: err.data,
    });
  } else if (err instanceof Objection.DataError) {
    error = new Problem(422, {
      detail: 'Sorry... the database does not like the data you provided :(',
    });
  }
  next(error);
};
