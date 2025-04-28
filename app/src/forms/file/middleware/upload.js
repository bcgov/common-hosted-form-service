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

/**
 * Helper function to create a Problem instance with status code 400.
 * @param {string} detail - The detail message for the Problem.
 * @returns {Problem} - A Problem instance with status code 400.
 */
const createBadRequestProblem = (detail) => {
  return new Problem(400, { detail });
};

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

const fileUpload = {
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
        const problem = new Problem(500, {
          detail: 'File Upload middleware has not been configured.',
        });
        next(problem);
        return;
      }

      uploader(req, res, (error) => {
        let problem;

        // Detect multer errors, send back nicer through the middleware stack.
        if (error instanceof multer.MulterError) {
          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              problem = createBadRequestProblem(`Upload file size is limited to ${maxFileSize} bytes`);
              break;

            case 'LIMIT_FILE_COUNT':
              problem = createBadRequestProblem(`Upload is limited to ${maxFileCount} files`);
              break;

            case 'LIMIT_UNEXPECTED_FILE':
              problem = createBadRequestProblem('Upload encountered an unexpected file');
              break;

            case 'LIMIT_PART_COUNT':
              problem = createBadRequestProblem('Upload rejected: upload form has too many parts');
              break;

            case 'LIMIT_FIELD_KEY':
              problem = createBadRequestProblem('Upload rejected: upload field name for the files is too long');
              break;

            case 'LIMIT_FIELD_VALUE':
              problem = createBadRequestProblem('Upload rejected: upload field is too long');
              break;

            case 'LIMIT_FIELD_COUNT':
              problem = createBadRequestProblem('Upload rejected: too many fields');
              break;

            default:
              problem = createBadRequestProblem(`Upload failed with the following error: ${error.message}`);
              break;
          }
        } else if (error) {
          problem = createBadRequestProblem(error.message);
        }

        if (problem) {
          next(problem);
          return;
        }

        next();
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = { fileUpload, fileSetup, createBadRequestProblem };
