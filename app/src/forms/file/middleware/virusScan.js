const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const Problem = require('api-problem');
const clamAvScanner = require('../../../components/clamAvScanner');
const log = require('../../../components/log')(module.filename);

/**
 * Validates that a file path is within a specified base directory.
 * @param {string} filePath - The file path to validate.
 * @param {string} [baseDirectory=os.tmpdir()] - The base directory to restrict file operations.
 * @returns {string} - The resolved and validated file path.
 * @throws {Error} - Throws an error if the file path is outside the base directory.
 */
const validateFilePath = (filePath, baseDirectory = os.tmpdir()) => {
  // Resolve the absolute path of the base directory
  const resolvedBaseDir = path.resolve(baseDirectory);

  // Resolve the absolute path of the file
  const resolvedFilePath = path.resolve(resolvedBaseDir, filePath);

  // Ensure the resolved file path is within the base directory
  if (!resolvedFilePath.startsWith(resolvedBaseDir)) {
    throw new Error(`Invalid file path: ${filePath} is outside the allowed directory.`);
  }

  return resolvedFilePath;
};

/**
 * Removes an infected file from the filesystem.
 * @param {string} filePath - The path of the file to remove.
 */
const removeInfected = async (filePath) => {
  try {
    if (validateFilePath(filePath)) {
      await fs.unlink(filePath);
      log.info(`Deleted infected file: ${filePath}`);
    }
  } catch (error) {
    log.error(`Could not delete infected file: ${filePath}. ${error.message}`);
  }
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

  try {
    const { path: filePath, originalname: fileName } = req.file;
    const scanResult = await clamAvScanner.scanFile(filePath);

    log.info(`${fileName} scanned. Is infected? ${scanResult.isInfected}. Viruses: ${scanResult.viruses || 'None'}`);

    if (scanResult.isInfected) {
      await removeInfected(filePath);
      return next(createVirusProblem(fileName, scanResult.viruses));
    }

    next();
  } catch (error) {
    log.error(`Error scanning file: ${req.file?.originalname || 'unknown'}. ${error.message}`);
    next(error);
  }
};

module.exports = { scanFile, removeInfected, createVirusProblem, validateFilePath };
