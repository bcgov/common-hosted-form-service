const Problem = require('api-problem');
const clamAvScanner = require('../../../components/clamAvScanner');
const log = require('../../../components/log')(module.filename);
const { fileUpload } = require('./upload');
const uploadCleanup = require('../uploadCleanup');

/**
 * Validates that a file path is within a specified base directory.
 * @param {string} filePath - The file path to validate.
 * @param {string} [baseDirectory] - The base directory to restrict file operations.
 * @returns {string} - The resolved and validated file path.
 * @throws {Error} - Throws an error if the file path is outside the base directory.
 */
const validateFilePath = (filePath, baseDirectory) => {
  return uploadCleanup.resolveUploadPath(filePath, baseDirectory || fileUpload.getFileUploadsDir());
};

/**
 * Removes an infected file from the filesystem.
 * @param {string} filePath - The path of the file to remove.
 */
const removeInfected = async (filePath) => {
  await uploadCleanup.removeUploadedFile(filePath, 'infected');
};

/**
 * Creates a Problem instance for infected files.
 * @param {string} fileName - The name of the infected file.
 * @param {Array<string>} viruses - List of detected viruses.
 * @returns {Problem} - A Problem instance.
 */
const createVirusProblem = (fileName, viruses) => {
  return new Problem(409, {
    detail: `Uploaded file (${fileName}) contains malware: ${viruses.join(', ')}`,
    viruses,
  });
};

/**
 * Middleware to scan uploaded files for viruses.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const scanFile = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const { path: filePath, originalname: fileName } = req.file;

  try {
    const scanResult = await clamAvScanner.scanFile(filePath);

    log.info(`${fileName} scanned. Is infected? ${scanResult.isInfected}. Viruses: ${scanResult.viruses || 'None'}`);

    if (scanResult.isInfected) {
      await removeInfected(filePath);
      return next(createVirusProblem(fileName, scanResult.viruses));
    }

    next();
  } catch (error) {
    log.error(`Error scanning file: ${fileName || 'unknown'}. ${error.message}`);
    await uploadCleanup.removeUploadedFile(filePath, 'scan-error');
    next(error);
  }
};

module.exports = { scanFile, removeInfected, createVirusProblem, validateFilePath };
