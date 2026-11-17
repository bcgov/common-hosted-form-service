const config = require('config');
const Problem = require('api-problem');
const clamAvScanner = require('../../../components/clamAvScanner');
const log = require('../../../components/log')(module.filename);
const fileService = require('../service');
const { fileUpload } = require('./upload');
const uploadCleanup = require('../uploadCleanup');

/**
 * Neutralizes user-controlled text before it is written to a log line by
 * stripping control characters (CR/LF/etc.), preventing log injection/forging.
 * @param {*} value - The value to sanitize (e.g. an uploaded file name).
 * @returns {string} - The value with control characters replaced by spaces.
 */
const sanitizeForLog = (value) => String(value ?? '').replace(/\p{Cc}/gu, ' ');

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

// Built-in values, used when a setting is missing or invalid. Keep
// maxConcurrentScans times the API replica count near clamd's thread count,
// and scanSlotWaitMs plus scanTimeoutMs under the route timeout (30s default).
const SCAN_DEFAULTS = Object.freeze({ maxConcurrentScans: 2, maxWaitingScans: 4, scanSlotWaitMs: 5000, scanTimeoutMs: 20000 });

const scanSetting = (key) => {
  const path = `files.clamav.${key}`;
  const raw = String(config.has(path) ? config.get(path) : SCAN_DEFAULTS[key]).trim();
  const value = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  return Number.isSafeInteger(value) && value > 0 && value <= 2147483647 ? value : SCAN_DEFAULTS[key];
};

/**
 * @function createScanSlots
 * A counting semaphore for concurrent scans. acquire() resolves true when a
 * slot is taken, or false when maxWaiting requests are already waiting or no
 * slot frees up within waitMs. Every true must be followed by exactly one
 * release(); a release hands the slot straight to the oldest waiter.
 *
 * @param {number} max the number of concurrent scans.
 * @param {number} waitMs how long acquire() waits for a free slot.
 * @param {number} maxWaiting how many acquire() calls may wait at once.
 */
const createScanSlots = (max, waitMs, maxWaiting) => {
  let active = 0;
  const waiting = [];

  const acquire = () => {
    if (active < max) {
      active += 1;
      return Promise.resolve(true);
    }
    if (waiting.length >= maxWaiting) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const waiter = { resolve };
      waiter.timer = setTimeout(() => {
        const index = waiting.indexOf(waiter);
        if (index >= 0) waiting.splice(index, 1);
        resolve(false);
      }, waitMs);
      waiter.timer.unref?.();
      waiting.push(waiter);
    });
  };

  const release = () => {
    const waiter = waiting.shift();
    if (waiter) {
      clearTimeout(waiter.timer);
      waiter.resolve(true);
    } else if (active > 0) {
      active -= 1;
    }
  };

  return {
    acquire,
    release,
    max,
    waitMs,
    maxWaiting,
    get active() {
      return active;
    },
    get waiting() {
      return waiting.length;
    },
  };
};

const scanSlots = createScanSlots(scanSetting('maxConcurrentScans'), scanSetting('scanSlotWaitMs'), scanSetting('maxWaitingScans'));
const scanTimeoutMs = scanSetting('scanTimeoutMs');

// Rejects when the scan does not settle in time. The scan itself may still be
// running in clamd; its own outcome is then ignored.
const withDeadline = (promise, ms) => {
  let timer;
  const deadline = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Scan did not finish within ${ms} ms`)), ms);
    timer.unref?.();
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
};

const clientGone = (req) => req.socket?.destroyed === true;

// Gives the upload back to the caller's upload rate limit when the server, not
// the caller, failed it (set by uploadRateLimit when the request was counted).
const refundUploadCount = (req) => {
  const refund = req.uploadRateLimitRefund;
  req.uploadRateLimitRefund = undefined;
  if (typeof refund === 'function') refund();
};

/**
 * Middleware to scan uploaded files for viruses.
 *
 * File names the service refuses anyway are rejected before a scan slot is
 * taken. At most maxConcurrentScans scans run at once on this pod; a request
 * that cannot get a slot (queue full, or none free within scanSlotWaitMs), or
 * whose scan fails, times out after scanTimeoutMs or is inconclusive, gets a
 * 503 and its upload is removed. Only a definite clean result continues. If
 * the client has gone, the upload is removed and the chain stops.
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
    fileService.validateFileSecurity(req.file);
  } catch (problem) {
    await uploadCleanup.removeUploadedFile(filePath, 'invalid-name');
    return next(problem);
  }

  if (!(await scanSlots.acquire())) {
    log.warn('Virus scan capacity reached', { file: sanitizeForLog(fileName), active: scanSlots.active, waiting: scanSlots.waiting });
    refundUploadCount(req);
    await uploadCleanup.removeUploadedFile(filePath, 'scan-busy');
    res.set('Retry-After', String(Math.ceil(scanSlots.waitMs / 1000)));
    return next(new Problem(503, { detail: 'File scanning is busy. Please try again shortly.' }));
  }

  if (clientGone(req)) {
    scanSlots.release();
    await uploadCleanup.removeUploadedFile(filePath, 'client-gone');
    return undefined;
  }

  let scanResult;
  try {
    scanResult = await withDeadline(clamAvScanner.scanFile(filePath), scanTimeoutMs);
  } catch (error) {
    log.error(`Error scanning file: ${sanitizeForLog(fileName) || 'unknown'}. ${error.message}`);
  } finally {
    scanSlots.release();
  }

  if (clientGone(req)) {
    await uploadCleanup.removeUploadedFile(filePath, 'client-gone');
    return undefined;
  }

  if (scanResult?.isInfected !== true && scanResult?.isInfected !== false) {
    if (scanResult) log.error(`Inconclusive scan for file: ${sanitizeForLog(fileName) || 'unknown'}`);
    refundUploadCount(req);
    await uploadCleanup.removeUploadedFile(filePath, 'scan-error');
    return next(new Problem(503, { detail: 'Unable to scan the file at this time. Please try again later.' }));
  }

  log.info(`${sanitizeForLog(fileName)} scanned. Is infected? ${scanResult.isInfected}. Viruses: ${scanResult.viruses || 'None'}`);

  if (scanResult.isInfected) {
    await removeInfected(filePath);
    return next(createVirusProblem(fileName, scanResult.viruses));
  }

  return next();
};

module.exports = { scanFile, removeInfected, createVirusProblem, validateFilePath, createScanSlots, scanSlots, scanTimeoutMs };
