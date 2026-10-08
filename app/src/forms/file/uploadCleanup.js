const fs = require('fs-extra');
const path = require('node:path');
const log = require('../../components/log')(module.filename);
const { fileUpload } = require('./middleware/upload');
const { FileStorage } = require('../common/models');

let sweepIntervalId = null;
let startupSweepTimeoutId = null;

/**
 * Resolves and validates that filePath is within the configured uploads directory.
 * Uses path.relative (not startsWith) to prevent prefix bypass (e.g. /tmp vs /tmp2).
 *
 * @param {string} filePath - Absolute or relative path to validate.
 * @param {string} [baseDirectory] - Optional base directory; defaults to configured upload dir.
 * @returns {string} Resolved absolute path within the uploads directory.
 * @throws {Error} When the path is outside the allowed directory.
 */
const resolveUploadPath = (filePath, baseDirectory) => {
  const uploadsDir = baseDirectory || fileUpload.getFileUploadsDir();
  const resolvedBase = fs.realpathSync(path.resolve(uploadsDir));

  let resolvedFile;
  try {
    resolvedFile = fs.realpathSync(path.resolve(resolvedBase, filePath));
  } catch (err) {
    if (err.code === 'ENOENT') {
      resolvedFile = path.resolve(resolvedBase, filePath);
    } else {
      throw err;
    }
  }

  const relative = path.relative(resolvedBase, resolvedFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Invalid file path: ${filePath} is outside the allowed directory.`);
  }

  return resolvedFile;
};

/**
 * Best-effort removal of a Multer temp file. Non-throwing; logs failures.
 *
 * @param {string|{ path: string }} fileOrPath - File path or multer file object.
 * @param {string} [reason] - Reason for deletion (logging).
 * @returns {Promise<boolean>} true if the file was removed.
 */
const removeUploadedFile = async (fileOrPath, reason = 'cleanup') => {
  try {
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path;
    if (!filePath) {
      return false;
    }

    const validatedPath = resolveUploadPath(filePath);
    if (!(await fs.pathExists(validatedPath))) {
      return false;
    }

    await fs.remove(validatedPath);
    log.info(`Removed upload temp file: ${validatedPath} (${reason})`);
    return true;
  } catch (error) {
    const label = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path;
    log.error(`Could not remove upload temp file: ${label}. ${error.message}`, { reason });
    return false;
  }
};

/**
 * Builds a set of absolute paths referenced by FileStorage rows (for sweep skip list).
 * @returns {Promise<Set<string>>}
 */
const _getReferencedUploadPaths = async () => {
  const rows = await FileStorage.query().select('path');
  const referenced = new Set();

  for (const row of rows) {
    if (!row.path) {
      continue;
    }
    referenced.add(row.path);
    try {
      if (path.isAbsolute(row.path)) {
        referenced.add(fs.realpathSync(row.path));
      }
    } catch {
      // Path may not exist on disk (e.g. object storage keys).
    }
  }

  return referenced;
};

/**
 * @param {string} resolvedPath
 * @param {Set<string>} referencedPaths
 * @returns {boolean}
 */
const _isPathReferenced = (resolvedPath, referencedPaths) => {
  if (referencedPaths.has(resolvedPath)) {
    return true;
  }

  for (const ref of referencedPaths) {
    if (!path.isAbsolute(ref)) {
      continue;
    }
    try {
      if (fs.realpathSync(ref) === resolvedPath) {
        return true;
      }
    } catch {
      // Ignore missing referenced paths.
    }
  }

  return false;
};

/**
 * Deletes stale files from the upload directory. Skips paths referenced in FileStorage.
 *
 * @param {Object} [options]
 * @param {number} [options.olderThanMs] - Minimum file age before deletion.
 * @param {number} [options.batchSize] - Max files to process per sweep.
 * @returns {Promise<{ deleted: number, scanned: number }>}
 */
const sweepUploadDir = async ({ olderThanMs = 24 * 60 * 60 * 1000, batchSize = 100 } = {}) => {
  const uploadsDir = fileUpload.getFileUploadsDir();
  const referencedPaths = await _getReferencedUploadPaths();
  const now = Date.now();
  let deleted = 0;
  let scanned = 0;

  let entries;
  try {
    entries = await fs.readdir(uploadsDir);
  } catch (err) {
    log.error(`Upload sweep: could not read directory ${uploadsDir}`, err);
    return { deleted, scanned };
  }

  for (const entry of entries) {
    if (scanned >= batchSize) {
      break;
    }
    scanned++;

    const candidatePath = path.join(uploadsDir, entry);
    try {
      const resolved = resolveUploadPath(candidatePath);
      if (_isPathReferenced(resolved, referencedPaths)) {
        continue;
      }

      const stat = await fs.stat(resolved);
      if (!stat.isFile()) {
        continue;
      }

      const age = now - stat.mtimeMs;
      if (age < olderThanMs) {
        continue;
      }

      await fs.remove(resolved);
      deleted++;
      log.info(`Upload sweep: removed stale file ${resolved} (age ${Math.round(age / 60000)} min)`);
    } catch (err) {
      log.error(`Upload sweep: error processing ${candidatePath}`, err);
    }
  }

  return { deleted, scanned };
};

/**
 * Starts periodic upload-directory sweeps.
 * @param {Object} [options] - From config files.uploads.cleanup.
 */
const startUploadCleanupScheduler = (options = {}) => {
  const enabled = options.enabled !== false && options.enabled !== 'false';
  if (!enabled) {
    return;
  }

  const staleAgeMinutes = Number.parseInt(options.staleAgeMinutes, 10) || 1440;
  const intervalMinutes = Number.parseInt(options.intervalMinutes, 10) || 60;
  const batchSize = Number.parseInt(options.batchSize, 10) || 100;

  const runSweep = async () => {
    try {
      const result = await sweepUploadDir({
        olderThanMs: staleAgeMinutes * 60 * 1000,
        batchSize,
      });
      if (result.deleted > 0) {
        log.info(`Upload sweep completed: deleted ${result.deleted} of ${result.scanned} scanned files`);
      }
    } catch (err) {
      log.error('Upload sweep failed', err);
    }
  };

  startupSweepTimeoutId = setTimeout(runSweep, 30000);
  sweepIntervalId = setInterval(runSweep, intervalMinutes * 60 * 1000);
  log.info('Upload cleanup scheduler started', {
    staleAgeMinutes,
    intervalMinutes,
    batchSize,
  });
};

/**
 * Stops scheduled upload sweeps (called on shutdown).
 */
const stopUploadCleanupScheduler = () => {
  if (startupSweepTimeoutId) {
    clearTimeout(startupSweepTimeoutId);
    startupSweepTimeoutId = null;
  }
  if (sweepIntervalId) {
    clearInterval(sweepIntervalId);
    sweepIntervalId = null;
  }
};

module.exports = {
  resolveUploadPath,
  removeUploadedFile,
  sweepUploadDir,
  startUploadCleanupScheduler,
  stopUploadCleanupScheduler,
};
