const bytes = require('bytes');
const fs = require('fs-extra');
const multer = require('multer');
const os = require('os');

const Problem = require('api-problem');

let fileUploadsDir = os.tmpdir();
let maxFileSize = bytes.parse('25MB');
let maxFileCount = 1;

let storage;
let uploader;

const fileSetup = (options) => {
  fileUploadsDir = (options && options.dir) || process.env.FILE_UPLOADS_DIR || fs.realpathSync(os.tmpdir());
  try {
    fs.ensureDirSync(fileUploadsDir);
  } catch (error) {
    throw new Error(`Could not create file uploads directory '${fileUploadsDir}'.`);
  }

  maxFileSize = (options && options.maxFileSize) || process.env.FILE_UPLOADS_MAX_FILE_SIZE || '25MB';
  maxFileSize = bytes.parse(maxFileSize);
  if (maxFileSize === null) {
    throw new Error('Could not determine max file size (bytes) for file uploads.');
  }

  maxFileCount = (options && options.maxFileCount) || process.env.FILE_UPLOADS_MAX_FILE_COUNT || '1';
  maxFileCount = parseInt(maxFileCount);
  if (isNaN(maxFileCount)) {
    maxFileCount = 1;
  }

  return { fileUploadsDir, maxFileSize, maxFileCount };
};

module.exports.fileUpload = {
  init(options) {
    let { fileUploadsDir, maxFileSize, maxFileCount } = fileSetup(options);

    const formFieldName = (options && options.fieldName) || process.env.FILE_UPLOADS_FIELD_NAME || 'files';

    storage = multer.diskStorage({
      destination: function (_req, _file, callback) {
        callback(null, fileUploadsDir);
      },
    });

    // Set up the multer, either array for multiple upload, or single for one.
    if (maxFileCount > 1) {
      uploader = multer({
        storage: storage,
        limits: { fileSize: maxFileSize, files: maxFileCount },
      }).array(formFieldName);
    } else {
      // Just in case we set a negative number.
      maxFileCount = 1;
      uploader = multer({
        storage: storage,
        limits: { fileSize: maxFileSize, files: maxFileCount },
      }).single(formFieldName);
    }
  },

  /**
   * Gets the directory where the files are uploaded to.
   *
   * @returns the file uploads directory.
   */
  getFileUploadsDir() {
    return fileUploadsDir;
  },

  async upload(req, res, next) {
    try {
      if (!uploader) {
        throw new Problem(500, {
          detail: 'File Upload middleware has not been configured.',
        });
      }

      uploader(req, res, (error) => {
        // Detect multer errors, send back nicer through the middleware stack.
        let problem;
        if (error instanceof multer.MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              problem = new Problem(400, {
                detail: `Upload file size is limited to ${maxFileSize} bytes`,
              });
              break;

            case 'LIMIT_FILE_COUNT':
              problem = new Problem(400, {
                detail: `Upload is limited to ${maxFileCount} files`,
              });
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              problem = new Problem(400, {
                detail: 'Upload encountered an unexpected file',
              });
              break;
            // We don't expect that we will encounter these in our api/app, but
            // here for completeness.

            case 'LIMIT_PART_COUNT':
              problem = new Problem(400, {
                detail: 'Upload rejected: upload form has too many parts',
              });
              break;
            case 'LIMIT_FIELD_KEY':
              problem = new Problem(400, {
                detail: 'Upload rejected: upload field name for the files is too long',
              });
              break;
            case 'LIMIT_FIELD_VALUE':
              problem = new Problem(400, {
                detail: 'Upload rejected: upload field is too long',
              });
              break;
            case 'LIMIT_FIELD_COUNT':
              problem = new Problem(400, {
                detail: 'Upload rejected: too many fields',
              });
              break;
            default:
              problem = new Problem(400, {
                detail: `Upload failed with the following error: ${error.message}`,
              });
          }
        }

        if (error) {
          problem = new Problem(400, {
            detail: error.message,
          });
        }
        if (problem) {
          next(problem);
        }

        next();
      });
    } catch (error) {
      next(error);
    }
  },
};
