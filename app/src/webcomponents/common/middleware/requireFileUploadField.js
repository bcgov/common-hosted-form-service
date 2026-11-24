const Problem = require('api-problem');

const { hasComponentType } = require('../../../forms/common/utils');

/**
 * Anonymous upload route only: the form's published version must have a file upload
 * field, so a Public form without one cannot be used to store files. Runs after
 * runtime-auth, which has loaded the published form from the path.
 */
module.exports = function requireFileUploadField(req, _res, next) {
  const schema = req.securityContext?.resource?.form?.versions?.[0]?.schema;
  if (!hasComponentType(schema, 'simplefile')) {
    return next(new Problem(403, { detail: 'This form does not accept file uploads.' }));
  }
  return next();
};
