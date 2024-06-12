const Problem = require('api-problem');
const Objection = require('objection');

/**
 * Given a subclass of DBError will create and throw the corresponding Problem.
 * If the error is of an unknown type it will not be converted.
 *
 * @param {DBError} error the error to convert to a Problem.
 * @returns nothing
 */
const _throwObjectionProblem = (error) => {
  if (error instanceof Objection.DataError) {
    throw new Problem(422, {
      detail: 'Sorry... the database does not like the data you provided :(',
    });
  }

  if (error instanceof Objection.NotFoundError) {
    throw new Problem(404, {
      detail: "Sorry... we still haven't found what you're looking for :(",
    });
  }

  if (error instanceof Objection.ConstraintViolationError) {
    throw new Problem(422, {
      detail: 'Constraint Violation Error',
    });
  }

  if (error instanceof Objection.ValidationError) {
    throw new Problem(422, {
      detail: 'Validation Error',
      errors: error.data,
    });
  }
};

/**
 * Send an error response for all errors except 500s, which are handled by the
 * code in app.js.
 *
 * @param {*} err the Error that occurred.
 * @param {*} _req the Express object representing the HTTP request - unused.
 * @param {*} res the Express object representing the HTTP response.
 * @param {*} next the Express chaining function.
 * @returns nothing
 */
module.exports.errorHandler = async (err, _req, res, next) => {
  try {
    if (err instanceof Objection.DBError || err instanceof Objection.NotFoundError || err instanceof Objection.ValidationError) {
      _throwObjectionProblem(err);
    }

    // Express throws Errors that are not Problems, but do have an HTTP status
    // code. For example, 400 is thrown when POST bodies are malformed JSON.
    if (!(err instanceof Problem) && (err.status || err.statusCode)) {
      throw new Problem(err.status || err.statusCode, {
        detail: err.message,
      });
    }

    // Not sure what it is, so also handle it in the catch block.
    throw err;
  } catch (error) {
    if (error instanceof Problem && error.status !== 500) {
      // Handle here when not an internal error. These are mostly from buggy
      // systems using API Keys, but could also be from frontend bugs. Note that
      // this does not log the error (see below).
      error.send(res);
    } else {
      // HTTP 500 Problems and all other exceptions should be handled by the
      // error handler in app.js. It will log them at the ERROR level and
      // include a full stack trace.
      next(error);
    }
  }
};
