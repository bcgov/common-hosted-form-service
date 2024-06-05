const Problem = require('api-problem');
const Objection = require('objection');

module.exports.dataErrors = async (err, _req, res, next) => {
  let error = err;
  if (err instanceof Objection.DataError) {
    error = new Problem(422, {
      detail: 'Sorry... the database does not like the data you provided :(',
    });
  } else if (err instanceof Objection.NotFoundError) {
    error = new Problem(404, {
      detail: "Sorry... we still haven't found what you're looking for :(",
    });
  } else if (err instanceof Objection.UniqueViolationError) {
    error = new Problem(422, {
      detail: 'Unique Validation Error',
    });
  } else if (err instanceof Objection.ValidationError) {
    error = new Problem(422, {
      detail: 'Validation Error',
      errors: err.data,
    });
  }

  if (error instanceof Problem && error.status !== 500) {
    // Handle here when not an internal error. These are mostly from buggy
    // systems using API Keys, but could also be from frontend bugs. Save the
    // ERROR level logs (below) for only the things that need investigation.
    error.send(res);
  } else {
    // HTTP 500 Problems and all other exceptions should be handled by the error
    // handler in app.js. It will log them at the ERROR level and include a full
    // stack trace.
    next(error);
  }
};
