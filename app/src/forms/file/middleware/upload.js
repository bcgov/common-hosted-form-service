const bytes = require('bytes');
const fs = require('fs-extra');
const multer = require('multer');
const os = require('os');

const Problem = require('api-problem');

let uploader = undefined;
let storage = undefined;
let maxFileSize = bytes.parse('25MB');
let maxFileCount = 1;

const fileSetup = (options) => {
  const fileUploadsDir = (options && options.dir) || process.env.FILE_UPLOADS_DIR || fs.realpathSync(os.tmpdir());
  try {
    fs.ensureDirSync(fileUploadsDir);
  } catch (e) {
    throw new Error(`Could not create file uploads directory '${fileUploadsDir}'.`);
  }

  maxFileSize = (options && options.maxFileSize) || process.env.FILE_UPLOADS_MAX_FILE_SIZE || '25MB';
  try {
    maxFileSize = bytes.parse(maxFileSize);
  } catch (e) {
    throw new Error('Could not determine max file size (bytes) for file uploads.');
  }

  maxFileCount = (options && options.maxFileCount) || process.env.FILE_UPLOADS_MAX_FILE_COUNT || '1';
  try {
    maxFileCount = parseInt(maxFileCount);
  } catch (e) {
    maxFileCount = 1;
  }

  return { fileUploadsDir, maxFileSize, maxFileCount };
};

module.exports.fileUpload = {

  init(options) {
    let { fileUploadsDir, maxFileSize, maxFileCount } = fileSetup(options);

    const formFieldName = (options && options.fieldName) || process.env.FILE_UPLOADS_FIELD_NAME || 'files';

    storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, fileUploadsDir);
      }
    });

    // set up the multer
    if (maxFileCount > 1) {
      uploader = multer({
        storage: storage,
        limits: { fileSize: maxFileSize, files: maxFileCount }
      }).array(formFieldName);
    } else {
      // just in case we set a negative number...
      maxFileCount = 1;
      uploader = multer({
        storage: storage,
        limits: { fileSize: maxFileSize, files: maxFileCount }
      }).single(formFieldName);
    }
  },

  async upload(req, res, next) {
    if (!uploader) {
      return next(new Problem(500, 'File Upload middleware has not been configured.'));
    }
    uploader(req, res, (err) => {
      // detect multer errors, send back nicer through the middleware stack...
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            next(new Problem(400, 'Upload file error', { detail: `Upload file size is limited to ${maxFileSize} bytes` }));
            break;
          case 'LIMIT_FILE_COUNT':
            next(new Problem(400, 'Upload file error', { detail: `Upload is limited to ${maxFileCount} files` }));
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            next(new Problem(400, 'Upload file error', { detail: 'Upload encountered an unexpected file' }));
            break;
          // we don't expect that we will encounter these in our api/app, but here for completeness
          case 'LIMIT_PART_COUNT':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: upload form has too many parts' }));
            break;
          case 'LIMIT_FIELD_KEY':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: upload field name for the files is too long' }));
            break;
          case 'LIMIT_FIELD_VALUE':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: upload field is too long' }));
            break;
          case 'LIMIT_FIELD_COUNT':
            next(new Problem(400, 'Upload file error', { detail: 'Upload rejected: too many fields' }));
            break;
          default:
            next(new Problem(400, 'Upload file error', { detail: `Upload failed with the following error: ${err.message}` }));
        }
      } else if (err) {
        // send this error to express...
        next(new Problem(400, 'Unknown upload file error', { detail: err.message }));
      } else {
        // all good, carry on.
        next();
      }
    });

  }
};
